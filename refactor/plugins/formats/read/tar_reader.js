const fs = require('fs');
const EventEmitter = require('events');
const { FileStat } = require('../../../util/file/filestat');
const { PassThrough } = require('stream');
const { Plugin } = require('../../plugin');
const tar = require('tar-stream');

/**
  * TarReader provides methods for listing and reading the contents
  * of tar files. This is used by the bag validator to validate tarred
  * bags without having to untar them first.
  *
  * Both TarReader and {@link FileSystemReader} implement a common
  * interface and emit a common set of events to provide the bag
  * validator with a uniform interface for reading bags packaged in
  * different formats.
  *
  * See the list() and read() functions below for information about
  * the events they emit.
 */
module.exports = class TarReader extends Plugin {

    /**
      * Creates a new TarReader.
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

    static description() {
        return {
            id: 'd1045d20-153b-478c-aca4-7192c4ce624f',
            name: 'TarReader',
            description: 'Built-in DART tar reader',
            version: '0.1',
            readsFormats: ['.tar'],
            writesFormats: [],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: []
        };
    }

    /**
      * The read() method reads the contents of the tar file.
      * It emits the events "entry", "error" and "end".
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
        var tarReader = this;
        var extract = tar.extract();
        tarReader.fileCount = 0;
        tarReader.dirCount = 0;
        extract.on('entry', function(header, stream, next) {

            var fileStat = tarReader._headerToFileStat(header);

            // relPath is the relative path of the file within
            // the tar file.
            var relPath = header.name;

            /**
             * @event TarReader#entry
             *
             * @description The entry event of the read() method includes both info
             * about the tar file (from the header) and a {@link ReadStream} object
             * that allows you to read the contents of the entry, if it's a file.
             * Note that you MUST read the stream to the end before TarReader.read()
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
            tarReader.emit('entry', { relPath: relPath, fileStat: fileStat, stream: stream });

            // When we reach the end of the read stream, tell the
            // tar-stream library to move on to the next entry.
            stream.on('end', function() {
                if (header.type === "file") {
                    tarReader.fileCount += 1;
                } else if (header.type === "directory") {
                    tarReader.dirCount += 1;
                }
                next() // ready for next entry
            });
        });

        /**
         * @event TarReader#error
         *
         * @description Indicates something went wrong while reading the tarfile.
         *
         * @type {Error}
         */
        extract.on('error', function(err) {
            tarReader.emit('error', err);
        });

        /**
         * @event TarReader#end
         *
         * @description This indicates that the iterator has passed
         * the last entry in the tar file and there's nothing left to read.
         */
        extract.on('finish', function() {
            tarReader.emit('end', tarReader.fileCount + tarReader.dirCount);
        });

        // Open the tar file and start reading.
        fs.createReadStream(tarReader.pathToTarFile).pipe(extract)
    }

    /**
      * The list() method returns information about the contents
      * files and directories inside a tar file. Unlike read(), it does
      * not return a readable stream for any of the files it encounters.
      *
      * list() emits the events "entry", "error" and "end".
      *
      */
    list() {
        var tarReader = this;
        var extract = tar.extract();
        tarReader.fileCount = 0;
        tarReader.dirCount = 0;


        /**
         * @event TarReader#entry
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
            var fileStat = tarReader._headerToFileStat(header);
            var relPath = header.name;
            tarReader.emit('entry', { relPath: relPath, fileStat: fileStat });
            stream.on('end', function() {
                if (header.type === "file") {
                    tarReader.fileCount += 1;
                } if (header.type === "directory") {
                    tarReader.dirCount += 1;
                }
                next();
            });
            stream.pipe(new PassThrough());
        });


        // Same as the error event documented above.
        extract.on('error', function(err) {
            tarReader.emit('error', err);
        });

        // Same as the end event documented above.
        extract.on('finish', function() {
            tarReader.emit('end', tarReader.fileCount + tarReader.dirCount);
        });

        // Open the tar file and start reading.
        fs.createReadStream(tarReader.pathToTarFile).pipe(extract)
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
