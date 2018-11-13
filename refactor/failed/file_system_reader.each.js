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
        this._readdir(this.pathToDirectory, 'read');
    }

    /**
      * The list() method recursively lists the contents of a directory
      * and returns a relative path and an fs.Stat object for each file
      * it encounters.
      *
      * It emits the events "entry", "error" and "finish".
      */
    list() {
        this._readdir(this.pathToDirectory, 'list');
    }

    _getEntry(filepath, op) {
        if (!fs.existsSync(filepath)) {
            return null;  // Symlinks give ENOENT error
        }
        let relPath = filepath.split(this.pathToDirectory)[1].replace(/^\//, '');
        let stats = fs.statSync(filepath);
        let readStream = null;
        if (op === "read") {
            if (stats.isFile()) {
                readStream = fs.createReadStream(filepath)
            } else {
                readStream = new DummyReader();
            }
        }
        return { fullPath: filepath, relPath: relPath, fileStat: stats, stream: readStream }
    }

    _readdir(dir, op) {
        let fsReader = this;
        glob(dir + "/**", function(err, files) {
            if (err != null) {
                fsReader.emit('error', err);
                return;
            }
            //console.log(files);
            function callback() { return true; }
            async.eachLimit(files, 1, function(filepath, callback) {
                let entry = fsReader._getEntry(filepath, op);
                if (entry == null) {
                    return;
                }
                console.log("Added " + filepath);
                if (entry.fileStat.isDirectory()) {
                    fsReader.dirCount++;
                } else if (entry.fileStat.isFile()) {
                    fsReader.fileCount++;
                }
                if (entry.stream) {
                    data.entry.stream.on('error', function(err) {
                        console.log(`Error reading ${data.entry.fullPath}: ${err.toString()}`);
                        data.fsReader.emit('error', err);
                        callback();
                    });
                    data.entry.stream.on('close', function() {
                        console.log(`Read ${data.entry.fullPath}`);
                        console.log(data.fsReader._queue.length());
                        callback();
                    });
                }
                fsReader.emit('entry', entry);
            }, function done(err) {
                fsReader.emit('finish');
            });
        });
    }
}

module.exports.FileSystemReader = FileSystemReader;
