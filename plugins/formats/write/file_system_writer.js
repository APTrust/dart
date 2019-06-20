const { BaseWriter } = require('./base_writer');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');


/**
 * FileSystemWriter writes files directly to the file system.
 * Use this for creating unserialzed bags.
 */
class FileSystemWriter extends BaseWriter {
    /**
     * Creates a new FileSystemWriter.
     *
     * @param {string} pathToOutputDir - The path to the directory
     * that you want to write files into.
     *
     */
    constructor(pathToOutputDir) {
        super('FileSystemWriter', writeIntoArchive);
        /**
          * pathToOutputDir is the path to the directory into which
          * the FileSystemWriter will write its files.
          *
          * @type {string}
          */
        this.pathToOutputDir = pathToOutputDir;
    }

    /**
     * Returns a {@link PluginDefinition} object describing this plugin.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: '92e69251-0e76-412d-95b6-987a79f6fa71',
            name: 'FileSystemWriter',
            description: 'Built-in DART file system writer. Writes files directly into a directory.',
            version: '0.1',
            readsFormats: [],
            writesFormats: ['directory'],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: []
        };
    }

    /**
     * Writes a file into the directory. This method is asynchronous, emitting
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
     */
    add(bagItFile, cryptoHashes = []) {
        super.add(bagItFile, cryptoHashes);
        var fsWriter = this;
        /**
         * @event FileSystemWriter#fileAdded - This event fires after a file
         * has been written to the file system.
         *
         * @type {BagItFile}
         *
         */
        var data = {
            bagItFile: bagItFile,
            dest: path.join(this.pathToOutputDir , bagItFile.relDestPath),
            hashes: cryptoHashes,
            endFn: () => {
                fsWriter.onFileWritten();
                fsWriter.emit('fileAdded', bagItFile);
            }
        };
        this._queue.push(data);
    }

}

/**
 * This is the worker function for the FileSystemWriter's one-at-a-time
 * async queue. This fuction writes data from a single file into the
 * target directory, calculating  any necessary checksums along the way.
 *
 * @param {Object} data - An object containing information about what is
 * to be written into the archive.
 *
 * @param {function} done - A callback that indicates when the writer has
 * completed. The async library creates and manages this function.
 *
 * @private
 */
function writeIntoArchive(data, done) {
    try {
        _writeIntoArchive(data, done);
    } catch (err) {
        done(err, data);
    }
}

function _writeIntoArchive(data, done) {
    if (!fs.existsSync(path.dirname(data.dest))) {
        mkdirp.sync(path.dirname(data.dest), { mode: 0o755 });
    }
    if (data.hashes.length == 0) {
        // Use fast fs copy if there are no hashes to compute
        fs.copyFileSync(data.bagItFile.absSourcePath, data.dest);
        data.endFn();
        done();
    } else {
        // Udderwize, pipe the data through the crypto hashes
        var reader = fs.createReadStream(data.bagItFile.absSourcePath);
        var writer = fs.createWriteStream(data.dest);
        var cb = function() {
            data.endFn();
            done();
        };
        writer.on('finish', cb);
        reader.pause();
        for (var h of data.hashes) {
            reader.pipe(h)
        }
        reader.pipe(writer);
        reader.resume();
    }
}

module.exports = FileSystemWriter;
