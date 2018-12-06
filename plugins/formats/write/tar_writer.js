const async = require('async');
const EventEmitter = require('events');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const { Plugin } = require('../../plugin');
const tar = require('tar-stream');

/**
 * TarWriter writes files directly into a tarball. By obviating the need
 * to copy files into a directory and then tar up the directory, this can
 * save considerable time and disk space when tarring large bags into a
 * tarred BagIt package.
 *
 */
module.exports = class TarWriter extends Plugin {
    /**
     * Creates a new TarWriter.
     *
     * @param {string} pathToTarFile - The path to the tar file you want to
     * create. You must have write permissions on this path, and the parent
     * directories should already exist. If a file already exists at the
     * speficied path, it will be overwritten.
     *
     */
    constructor(pathToTarFile) {
        super();
        /**
          * pathToTarFile is the path to the file we will write.
          * The file's parent directories should exist before writing, and you
          * must have write permissions on the file. If the file already
          * exists, it will be overwritten.
          *
          * @type {string}
          */
        this.pathToTarFile = pathToTarFile;
        /**
          * bagName is the name of the bag, which is the tar file name
          * minus the leading path and trailing ".tar" extension.
          *
          * @type {string}
          */
        this.bagName = path.basename(pathToTarFile, '.tar');
        /**
          * This is a special stream for serializing data into tar file format.
          *
          * @type {stream.Writable}
          * @private
          */
        this._tarPacker = null;
        /**
          * The stream used to write tar file contents onto disk.
          *
          * @type {stream.Writable}
          * @private
          */
        this._tarOutputWriter = null;
        /**
          * Asynchronous queue for writing files one at a time into the tar
          * archive.
          *
          * @type {async.queue}
          * @private
          */
        this._queue = async.queue(writeIntoArchive, 1);
        var tarWriter = this;
        this._queue.drain = function () {
            tarWriter.emit('finish');
        }
    }

    /**
     * Returns a {@link PluginDefinition} object describing this plugin.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: '90110710-1ff9-4650-a086-d7b23772238f',
            name: 'TarWriter',
            description: 'Built-in DART tar writer. Writes files directory into a tarball.',
            version: '0.1',
            readsFormats: [],
            writesFormats: ['.tar'],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: []
        };
    }

    /**
     * Writes a file into the tar archive. This method is asynchronous, emitting
     * events 'fileAdded' when it's done writing a file.
     *
     * Files will be written into the archive in the order they are added.
     * Because tar file contents must be written one at a type, this class
     * internally manages one-at-a-time write serialization.
     *
     * You'll get errors if bagItFile.absSourcePath does not exist or is not
     * readable.
     *
     * @param {BagItFile} bagItFile - The BagItFile object describing the file
     * to be added into the tar file.
     *
     * @param {Array<crypto.Hash>} cryptoHashes - An array of Node.js crypto.Hash
     * objects used to calculate checksums of the files being written into
     * the tarball. All digests are calculated during the write, so adding
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
        var tarWriter = this;
        var header = {
            // Don't use path.join because Windows will give us
            // backslashes and tar file needs forward slashes.
            name: this.bagName + '/' + bagItFile.relDestPath,
            size: bagItFile.size,
            mode: bagItFile.mode,
            uid: bagItFile.uid,
            gid: bagItFile.gid,
            mtime: bagItFile.mtime
        };
        // pax headers allow us to include files over 8GB in size
        header.pax = {
            size: bagItFile.size
        };

        var data = {
            bagItFile: bagItFile,
            header: header,
            tar: this._getTarPacker(),
            hashes: cryptoHashes,
            endFn: () => tarWriter.emit('fileAdded', bagItFile)
        };
        this._queue.push(data);
    }

    /**
     * This returns the tar-stream packer object, creating it if it
     * doesn't already exist. The tar-stream packer transforms data to
     * tar format before the output writer writes it to disk.
     *
     * @returns {stream.Writable}
     * @private
     */
    _getTarPacker() {
        if (this._tarPacker == null) {
            this._tarPacker = tar.pack();
            this._tarPacker.pipe(this._getTarOutputWriter());
        }
        return this._tarPacker;
    }

    /**
     * This returns the stream that allows us to write our tar file to the
     * file system, creating the stream if it doesn't already exist.
     *
     * @returns {stream.Writable}
     * @private
     */
    _getTarOutputWriter() {
        if (this._tarOutputWriter == null) {
            if (!this.pathToTarFile.endsWith(".tar")) {
                throw `pathToTarFile '${this.pathToTarFile}' must have .tar extension`;
            }
            var dir = path.dirname(this.pathToTarFile);
            if (!fs.existsSync(dir)) {
                mkdirp.sync(dir, { mode: 0o755 });
            }
            var options = {
                mode: 0o644,
                autoClose: false
            };
            this._tarOutputWriter = fs.createWriteStream(this.pathToTarFile, options);
        }
        return this._tarOutputWriter;
    }
}

/**
 * This is the worker function for the TarWriter's one-at-a-time async queue.
 * This fuction writes data from a single file into the tarball, calculating
 * any necessary checksums along the way.
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
    var reader = fs.createReadStream(data.bagItFile.absSourcePath);
    var writer = data.tar.entry(data.header, done);
    writer.on('finish', data.endFn);
    reader.pause();
    for (var h of data.hashes) {
        reader.pipe(h)
    }
    reader.pipe(writer);
    reader.resume();
}
