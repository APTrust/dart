const fs = require('fs');
const EventEmitter = require('events');
const { FileStat } = require('../util/file/filestat');
const { PassThrough } = require('stream');
const tar = require('tar-stream');

/**
  * TarIterator provides methods for listing and reading the contents
  * of tar files. This is used by the bag validator to validate tarred
  * bags without having to untar them first.
  *
  * Both TarIterator and {@link FileSystemIterator} implement a common
  * interface and emit a common set of events to provide the bag
  * validator with a uniform interface for reading bags packaged in
  * different formats.
  *
  * See the list() and read() functions below for information about
  * the events they emit.
 */
class TarIterator extends EventEmitter {

    /**
      * Creates a new TarIterator.
      *
      * @param {string} pathToTarFile - This should be the absolute
      * path to the tar file you want to read.
     */
    constructor(pathToTarFile) {
        super();
        /**
         * pathToTarFile is the absolute path to the tar file that
         * this iterator will read.
         *
         * @type {string}
         */
        this.pathToTarFile = pathToTarFile;
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
      * The read() method reads the contents of the tar file.
      * It emits the events "entry", "error" and "finish".
      *
      * The read() method returns the same information as the
      * list() method, plus a readable stream from which you can
      * extract the contents of individual tar files.
      *
      * Note that read() will not advance to the next entry
      * until you've read the entire stream returned returned by
      * the "entry" event.
      *
      */
    read() {
        var tarIterator = this;
        var extract = tar.extract();
        tarIterator.fileCount = 0;
        tarIterator.dirCount = 0;
        extract.on('entry', function(header, stream, next) {

            var fileStat = tarIterator._headerToFileStat(header);

            // relPath is the relative path of the file within
            // the tar file.
            var relPath = header.name;

            /**
             * @event TarIterator#entry
             *
             * @description The entry event of the read() method includes both info
             * about the tar file (from the header) and a {@link ReadStream} object
             * that allows you to read the contents of the entry, if it's a file.
             * Note that you MUST read the stream to the end before TarIterator.read()
             * will move to the next tar entry.
             *
             * @type {object}
             *
             * @property {string} relPath - The relative path (within the tar file)
             * of the entry.
             *
             * @property {ReadStream} stream - A stream from which you can read the
             * contents of the entry.
             *
             * @property {FileStat} fileStat - An object containing a subset info similar
             * to the fs.Stats object, describing the file's size and other attributes.
             */
            tarIterator.emit('entry', { relPath: relPath, fileStat: fileStat, stream: stream });

            // When we reach the end of the read stream, tell the
            // tar-stream library to move on to the next entry.
            stream.on('end', function() {
                if (header.type === "file") {
                    tarIterator.fileCount += 1;
                } else if (header.type === "directory") {
                    tarIterator.dirCount += 1;
                }
                next() // ready for next entry
            });
        });

        /**
         * @event TarIterator#error
         *
         * @description Indicates something went wrong while reading the tarfile.
         *
         * @type {Error}
         */
        extract.on('error', function(err) {
            tarIterator.emit('error', err);
        });

        /**
         * @event TarIterator#finish
         *
         * @description This indicates that the iterator has passed
         * the last entry in the tar file and there's nothing left to read.
         */
        extract.on('finish', function() {
            tarIterator.emit('finish', tarIterator.fileCount + tarIterator.dirCount);
        });

        // Open the tar file and start reading.
        fs.createReadStream(tarIterator.pathToTarFile).pipe(extract)
    }

    /**
      * The list() method returns information about the contents
      * files and directories inside a tar file. Unlike read(), it does
      * not return a readable stream for any of the files it encounters.
      *
      * list() emits the events "entry", "error" and "finish".
      *
      */
    list() {
        var tarIterator = this;
        var extract = tar.extract();
        tarIterator.fileCount = 0;
        tarIterator.dirCount = 0;


        /**
         * @event TarIterator#entry
         *
         * @description The entry event of the list() method returns info about
         * the tar entry, but no reader to read the contents of the entry.
         *
         * @type {object}
         *
         * @property {string} relPath - The relative path (within the tar file)
         * of the entry.
         *
         * @property {FileStat} fileStat - An object containing a subset info similar
         * to the fs.Stats object, describing the file's size and other attributes.
         *
         */
        extract.on('entry', function(header, stream, next) {
            var fileStat = tarIterator._headerToFileStat(header);
            var relPath = header.name;
            tarIterator.emit('entry', { relPath: relPath, fileStat: fileStat });
            stream.on('end', function() {
                if (header.type === "file") {
                    tarIterator.fileCount += 1;
                } if (header.type === "directory") {
                    tarIterator.dirCount += 1;
                }
                next();
            });
            stream.pipe(new PassThrough());
        });


        // Same as the error event documented above.
        extract.on('error', function(err) {
            tarIterator.emit('error', err);
        });

        // Same as the finish event documented above.
        extract.on('finish', function() {
            tarIterator.emit('finish', tarIterator.fileCount + tarIterator.dirCount);
        });

        // Open the tar file and start reading.
        fs.createReadStream(tarIterator.pathToTarFile).pipe(extract)
    }

    _headerToFileStat(header) {
        return new FileStat({
            size: header.size,
            mode: header.mode,
            uid: header.uid,
            gid: header.gid,
            mtimeMs: header.mtime,
            type: header.type
        });
    }
}

module.exports.TarIterator = TarIterator;
