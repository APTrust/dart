const async = require('async');
const { DummyReader } = require('../util/file/dummy_reader');
const EventEmitter = require('events');
const fs = require('fs');
const { PassThrough } = require('stream');
const path = require('path');

/**
  * FileSystemReader provides methods for listing and reading the contents
  * of directories on a locally mounted file system. This is used by the bag
  * validator to validate unserialized (i.e. untarred, unzipped, etc.) bags.
  *
  * Both FileSystemReader and {@link TarReader} implement a common
  * interface and emit a common set of events to provide the bag
  * validator with a uniform interface for reading bags packaged in
  * different formats.
  *
  * See the list() and read() functions below for information about
  * the events they emit.
 */
class FileSystemReader extends EventEmitter {

    /**
      * Creates a new FileSystemReader.
      *
      * @param {string} pathToDirectory - The absolute path to the directory
      * you want to read.
     */
    constructor(pathToDirectory) {
        super();
        /**
         * pathToDirectory is the absolute path to the directory
         * you want to read.
         *
         * @type {string}
         */
        this.pathToDirectory = pathToDirectory;
        /**
         * fileCount is the number of files encountered during a read()
         * or list() operation.
         *
         * @type {number}
         */
        this.fileCount = 0;
        /**
         * dirCount is the number of directories encountered during a
         * read() or list() operation.
         *
         * @type {number}
         */
        this.dirCount = 0;

        this._queue = null;
    }

    /**
      * The read() method recursively lists the contents of a directory
      * and returns an open reader for each file it encounters.
      *
      * It emits the events "entry", "error" and "finish".
      *
      * Note that read() will not advance to the next entry
      * until you've read the entire stream returned by
      * the "entry" event.
      *
      */
    read() {
        var fsReader = this;
        this._queue = async.queue(fsReader._entryFunc, 1);
        this._queue.drain = function() { fsReader.emit('finish', this.fileCount) };
        fsReader._readdir(fsReader.pathToDirectory, 'read');
    }

    /**
      * The list() method recursively lists the contents of a directory
      * and returns a relative path and an fs.Stat object for each file
      * it encounters.
      *
      * It emits the events "entry", "error" and "finish".
      */
    list() {
        var fsReader = this;
        this._queue = async.queue(fsReader._entryFunc, 1);
        this._queue.drain = function() { fsReader.emit('finish', this.fileCount) };
        fsReader._readdir(fsReader.pathToDirectory, 'list');
    }

    _getEntry(filepath) {
        var absPath = path.join(this.pathToDirectory, filepath);
        if (!fs.existsSync(absPath)) {
            return null;  // Symlinks give ENOENT error
        }
        return { fullPath: absPath, relPath: filepath, stats: fs.statSync(absPath) }
    }

    _readdir(dir, op) {
        let fsReader = this;
        fs.readdir(dir, function(err, files) {
            if (err != null) {
                fsReader.emit('error', err);
                return;
            }
            for (let filepath of files) {
                let entry = fsReader._getEntry(filepath);
                if (entry != null) {
                    entry.op = op;
                    if (entry.stats.isDirectory()) {
                        fsReader.fileCount++;
                        fsReader._readdir(entry.fullPath);
                    } else if (entry.stats.isFile()) {
                        fsReader.dirCount++;
                        fsReader._fileQueue.push(entry, fsReader._onErr);
                    }
                }
            }
        });
    }

    _entryFunc(entry, done) {
        let fsReader = this;
        if (entry == null) {
            done();
            return;
        }
        // Don't open the stream until we're ready to read,
        // else we'll have too many open filehandles.
        if (entry.stats.isDirectory()) {
            entry.stream = new DummyReader();
        } else if (entry.stats.isFile()) {
            if (entry.op === 'read') {
                console.log(`Added ${entry.fullPath}`);
                entry.stream = fs.createReadStream(entry.fullPath);
                entry.stream.on('error', fsReader._onErr);
            } else {
                entry.stream = new DummyReader();
            }
            fsReader._fileQueue.push(entry, fsReader._onErr);
        }
        entry.stream.on('close', function() {
            console.log(`Read ${entry.fullPath}`);
            done();
        });
        this.emit('entry', entry);
    }

    _onErr(err) {
        this.emit('error', err);
    }
}

module.exports.FileSystemReader = FileSystemReader;
