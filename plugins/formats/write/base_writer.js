const async = require('async');
const { Plugin } = require('../../plugin');

/**
  * BaseWriter is the base class for writing files into a package.
  * It implements an asynchronous queue to write files one at a time
  * in the order they were added. This allows it to work with async
  * and stream-based Node packages like tar-stream, while also supporting
  * serialized formats that must be written one at time, in order (such
  * as tar format).
  *
  * @param {string} name - The name of the subclass that derives from this
  * class. That is, the name of your own implementation. This name is
  * used for logging and debugging.
  *
  * @param {function} writeFn - The function that writes each file into
  * the archive, directory, or serialized format you are creating. This
  * function should take two params, (data, done), where data is any
  * JavaScript object and done is a callback to be called when the file
  * has finished being written.
  *
  * See {@link TarWriter} or {@link FileSystemWriter} for examples of
  * the writeFn and how subclasses can be implement.
  *
  */
class BaseWriter extends Plugin {
    constructor(name, writeFn) {
        super();

        if (typeof writeFn != 'function') {
            throw new Error(Context.y18n.__('Param %s must be a function', 'writeFn'));
        }

        /**
         * The name of the module. This is required for logging and
         * debugging purposes.
         *
         * @type {string}
         */
        this.name = name;

        /**
          * Asynchronous queue for writing files one at a time onto the
          * file system. The final step of any subclass's add() function
          * will be to push data into this queue. See the add() implementations
          * in {@link TarWriter} and {@link FileSystemWriter} for examples.
          *
          * @type {async.queue}
          */
        this._queue = async.queue(writeFn, 1);
        var writer = this;

        /**
         * @event FileSystemWriter#finish - This event fires after all files
         * have been written to the file system.
         *
         * Queue may drain before writes actually complete, so we check the
         * total number of files written before firing the finish event.
         *
         * @type {BagItFile}
         *
         */
        this._queue.drain = function () {
            let intervalCount = 0;
            let doneInterval = setInterval(function() {
                intervalCount += 1;
                if (intervalCount % 50 == 0) {
                    Context.logger.warn(Context.y18n.__(`%s is still writing final file to archive.`, this.name));
                }
                if (writer.filesWritten == writer.filesAdded) {
                    writer.emit('finish');
                    clearInterval(doneInterval);
                }
            }, 50);
        }

        /**
         * @event FileSystemWriter#error - This event fires when a write
         * error occurs, or if the system cannot access the files to be
         * written. This immediately fires the finish event after passing
         * the error.
         *
         * @type {string}
         */
        this._queue.error = function(err, task) {
            if (err) {
                writer._queue.pause();  // stop processing
                writer._queue.kill();   // empty the queue & remove drain fn
                writer.emit('error', `${this.name}: ${err.message}`);
                writer.emit('finish');
            }
        }

        /**
         * The total number of files added to the write queue.
         *
         * @type {number}
         */
        this.filesAdded = 0;

        /**
         * The total number of files that have been written into the
         * tar file.
         *
         * @type {number}
         */
        this.filesWritten = 0;
    }

    /**
     * Returns a {@link PluginDefinition} object describing this plugin.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: '8bac73e0-1aae-4afd-bfa3-327314befd2a',
            name: 'BaseWriter',
            description: 'BaseWriter for other format writers.',
            version: '1.0',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: []
        };
    }

    /**
     * Returns the percent complete of the total write operations.
     * This will be a number between 0 and 100. E.g. 42.833.
     *
     * @returns {number}
     */
    percentComplete() {
        return (this.filesWritten / this.filesAdded) * 100;
    }

    /**
     * Writes a file into the directory, tar archive, or whatever format the
     * underlying writer supports. This method is asynchronous, emitting
     * events 'fileAdded' when it's done writing a file.
     *
     * Files will be written in the order they were added. You'll get errors
     * if bagItFile.absSourcePath does not exist or is not readable.
     *
     * @param {BagItFile} bagItFile - The BagItFile object describing the file
     * to be added into the output directory.
     *
     * @param {Array<crypto.Hash>} cryptoHashes - An array of Node.js crypto.Hash
     * objects used to calculate checksums of the files being written onto the
     * file system. All digests are calculated during the write, so adding
     * multiple hashes will not lead to multiple end-to-end reads of the
     * input stream.
     *
     * You can omit this parameter if you don't care to calculate
     * checksums. If present, the digests will be written into the
     * bagItFile.checksums object. For example, if cryptoHashes includes md5
     * and sha256 Hash objects, bagItFile.checksums will come out looking
     * like this:
     *
     * @example
     * bagItFile.checksums = {
     *     'md5': '1234567890',
     *     'sha256': '0987654321'
     * }
     *
     * The add() method of your derived class should call this before it
     * continues with your own custom processing. See the add() implementations
     * in {@link TarWriter} and {@link FileSystemWriter} for examples.
     *
     */
    add(bagItFile, cryptoHashes = []) {
        this.filesAdded += 1;
    }

    /**
     * Call this after a file is written, to keep an accurate
     * count of how many files have been written. See {@link
     * TarWriter} or {@link FileSystemWriter} for examples.
     */
    onFileWritten() {
        this.filesWritten += 1;
    }
}

module.exports.BaseWriter = BaseWriter;
