const fs = require('fs');
const { DummyReader } = require('../../../util/file/dummy_reader');
const EventEmitter = require('events');
const { PassThrough } = require('stream');
const { Plugin } = require('../../plugin');
const readdirp = require('readdirp');

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
module.exports = class FileSystemReader extends Plugin {

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
     * Returns a {@link PluginDefinition} object describing this plugin.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: '265f724e-8289-4bf7-bbdf-803a65bcdf19',
            name: 'FileSystemReader',
            description: 'Built-in DART file system reader',
            version: '0.1',
            readsFormats: ['directory'],
            writesFormats: [],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: []
        };
    }

    /**
      * The read() method recursively lists the contents of a directory
      * and returns an open reader for each file it encounters.
      *
      * It emits the events "entry", "error" and "end".
      *
      * Note that read() will not advance to the next entry
      * until you've read the entire stream returned by
      * the "entry" event.
      *
      */
    read() {
        var fsReader = this;
        var stream = readdirp({ root: fsReader.pathToDirectory, entryType: "all" });
        fsReader.fileCount = 0;
        fsReader.dirCount = 0;

        // Undocumented because it doesn't conform to the TarReader
        // list of events, and we don't plan on using it.
        stream.on('warn', function(warning) {
            fsReader.emit('warn', warning);
        });

        /**
         * @event FileSystemReader#error
         *
         * @description Indicates something went wrong while reading the directory
         * or one of its subdirectories.
         *
         * @type {Error}
         */
        stream.on('error', function(error) {
            fsReader.emit('err', error);
        });

        /**
         * @event FileSystemReader#end
         *
         * @description This indicates that the iterator has passed
         * the last entry in the recursive directory tree and there's
         * nothing left to read.
         */
        stream.on('end', function() {
            fsReader.emit('end', fsReader.fileCount)
        });

        // Undocumented because it doesn't conform to the TarReader
        // list of events, and we don't plan on using it.
        stream.on('close', function() {
            fsReader.emit('close');
        });

        /**
         * @event FileSystemReader#entry
         *
         * @description The entry event of the read() method includes both info
         * about a file in the directory and a {@link ReadStream} object
         * that allows you to read the contents of the entry, if it's a file.
         *
         * Note that you MUST read the stream to the end or call the stream's close()
         * method before FileSystemReader.read() will move to the next tar entry.
         *
         * @type {object}
         *
         * @property {string} relPath - The relative path (within pathToDirectory)
         * of the entry.
         *
         * @property {ReadStream} stream - A stream from which you can read the
         * contents of the entry.
         *
         * @property {Stats} fileStat - An fs.Stats object describing the file's size
         * and other attributes.
         */
        stream.on('data', function(entry) {
            // Emit relPath, fs.Stat and readable stream to match what
            // TarReader emits. Caller can get full path
            // by prepending FileSystemReader.pathToDirectory
            // to entry.path, which is relative.
            //
            // Also note that we want to mimic the behavior of
            // TarFileReader by returning only one open readable stream
            // at a time. This is why we pause the stream and don't
            // resume it until the caller is done reading the underlying
            // file. That causes a race condition, however. See the HACK
            // comment above.
            //
            // One other reason for pausing on read is that it prevents
            // us from having too many open file handles when we're working
            // with a directory that contains thousands of files.

            // TODO: We have to use pause/resume to avoid too many
            // open file handles, but pause/resume is flaky here.
            // It hangs on some versions of OSX but not on others.

            // Consider: https://www.npmjs.com/package/readdir-enhanced


            var readable = null;
            //stream.pause();
            if (entry.stat.isFile()) {
                fsReader.fileCount += 1;
                readable = fs.createReadStream(entry.fullPath);
            } else {
                readable = new DummyReader();
                if (entry.stat.isDirectory()) {
                    fsReader.dirCount += 1;
                }
            }
            // readable.on('error', function() {
            //     stream.resume();
            // });
            // readable.on('close', function() {
            //     stream.resume();
            // });
            fsReader.emit('entry', { relPath: entry.path, fileStat: entry.stat, stream: readable });
        });
    }

    /**
      * The list() method recursively lists the contents of a directory
      * and returns a relative path and an fs.Stat object for each file
      * it encounters.
      *
      * It emits the events "entry", "error" and "end".
      */
    list() {
        var fsReader = this;
        var stream = readdirp({ root: fsReader.pathToDirectory, entryType: "all" });
        fsReader.fileCount = 0;
        fsReader.dirCount = 0;

        // Undocumented because it doesn't conform to the TarReader
        // list of events, and we don't plan on using it.
        stream.on('warn', function(warning) {
            fsReader.emit('warn', warning);
        });

        // Same as the error event documented above.
        stream.on('error', function(error) {
            fsReader.emit('err', error);
        });

        // Same as the finish event documented above.
        stream.on('end', function() {
            fsReader.emit('end', fsReader.fileCount);
        });

        // Undocumented because it doesn't conform to the TarReader
        // list of events, and we don't plan on using it.
        stream.on('close', function() {
            fsReader.emit('close');
        });

        /**
         * @event FileSystemReader#entry
         *
         * @description The entry event of the list() method returns info
         * about a file or directory, including its relative path and an
         * fs.Stats object.
         *
         * @type {object}
         *
         * @property {string} relPath - The relative path (within pathToDirectory)
         * of the entry.
         *
         * @property {Stats} fileStat - An fs.Stats object describing the file's size
         * and other attributes.
         */
        stream.on('data', function(entry) {
            // Emit relPath and fs.Stat object to match what
            // TarReader emits. Caller can get full path
            // by prepending FileSystemReader.pathToDirectory
            // to entry.path, which is relative.
            if (entry.stat.isFile()) {
                fsReader.fileCount += 1;
            } else if (entry.stat.isDirectory()) {
                fsReader.dirCount += 1;
            }
            fsReader.emit('entry', { relPath: entry.path, fileStat: entry.stat });
        });
    }
}
