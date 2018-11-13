const async = require('async');
const { DummyReader } = require('../util/file/dummy_reader');
const EventEmitter = require('events');
const fs = require('fs');
const glob = require("glob")
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
        this._queue = async.queue(entryFunc, 1);
        this._queue.drain = function() {
            console.log(`****** FINISHED ${fsReader.pathToDirectory} *******`);
            fsReader.emit('finish', fsReader.fileCount);
        };
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
        this._queue = async.queue(entryFunc, 4);
        this._queue.drain = function() {
            console.log(`****** FINISHED ${fsReader.pathToDirectory} *******`);
            fsReader.emit('finish', fsReader.fileCount);
        };
        fsReader._readdir(fsReader.pathToDirectory, 'list');
    }

    _getEntry(filepath) {
        if (!fs.existsSync(filepath)) {
            return null;  // Symlinks give ENOENT error
        }
        var relPath = filepath.split(this.pathToDirectory)[1].replace(/^\//, '');
        return { fullPath: filepath, relPath: relPath, fileStat: fs.statSync(filepath) }
    }

    _readdir(dir, op) {
        let fsReader = this;
        glob(dir + "/**", function(err, files) {
            if (err != null) {
                fsReader.emit('error', err);
                return;
            }
            console.log(files);
            for (let filepath of files) {
                let entry = fsReader._getEntry(filepath);
                if (entry != null) {
                    let data = {
                        entry: entry,
                        op: op,
                        fsReader: fsReader
                    };
                    fsReader._queue.push(data);
                }
            }
        });
    }
}

function entryFunc(data, done) {
    // Don't open the stream until we're ready to read,
    // else we'll have too many open filehandles.
    if (data.entry.fileStat.isDirectory()) {
        data.fsReader.dirCount++;
        if (data.op === 'read') {
            console.log(`Added dir ${data.entry.fullPath}`);
            data.entry.stream = new DummyReader();
        } else { // this is a list operation
            done();
        }
    } else if (data.entry.fileStat.isFile()) {
        data.fsReader.fileCount++;
        if (data.op === 'read') {
            console.log(`Added file ${data.entry.fullPath}`);
            data.entry.stream = fs.createReadStream(data.entry.fullPath);
        } else { // this is a list operation
            done();
        }
    } else {
        console.log(`Don't know ${data.entry.fullPath} is`);
        done();
    }
    if (data.entry.stream) {
        data.entry.stream.on('error', function(err) {
            console.log(`Error reading ${data.entry.fullPath}: ${err.toString()}`);
            data.fsReader.emit('error', err);
            done();
        });
        data.entry.stream.on('close', function() {
            console.log(`Read ${data.entry.fullPath}`);
            console.log(data.fsReader._queue.length());
            done();
        });
    }
    data.fsReader.emit('entry', data.entry);
}

module.exports.FileSystemReader = FileSystemReader;
