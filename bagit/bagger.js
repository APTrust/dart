const { BagItFile } = require('./bagit_file');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const dateFormat = require('dateformat');
const EventEmitter = require('events');
const fs = require('fs');
const { KeyValueCollection } = require('./key_value_collection');
const mkdirp = require('mkdirp');
const { OperationResult } = require('../core/operation_result');
const os = require('os');
const path = require('path');
const { PluginManager } = require('../plugins/plugin_manager');
const { TagDefinition } = require('./tag_definition');
const { Util } = require('../core/util');

/**
 * Bagger creates a bag based on a BagItProfile.
 *
 * @param {Job} job - A job object that includes a
 * {@link PackageOperation} describing a number of files to be
 * packaged and a {@link BagItProfile} describing how to package them.
 *
 * Since bagging is basically a streaming operation, streaming data
 * into a specified format, this class implements a subset of the
 * Node.js stream events. The 'error' and 'finish' events are the
 * primary ones to listen to.
 *
 *
 * @example
 * // Assuming you have already created a Job object
 * var bagger = new Bagger(job);
 * bagger.on('error', function(err) {
 *    // Check the contents of job.packageOperation.result.errors
 *    // for details of what went wrong.
 * });
 * bagger.on('fileAdded', function(bagItFile, percentComplete) {
 *    // Do something with the BagItFile, such as displaying
 *    // a message saying it's been written into the bag.
 *    // Don't alter the bagItFile object since it's still
 *    // in use by the bagger. percentComplete is a number
 *    // between 0 and 100 indicating what percentage of the
 *    // total write job is complete.
 * });
 * bagger.on('finish', function() {
 *     // Do whatever you want when the bag is complete.
 *     // If needed, you can inspect the contents of the bagger.bagItFiles
 *     // array. Manifests and tag files in the bagItFiles array
 *     // will include the file contents. Payload files will not.
 * });
 * bagger.create();
 *
 */
class Bagger extends EventEmitter {
    constructor(job) {
        super();
        /**
         * The Job object contains information about what the bagger
         * is supposed to bag, and according to what profile.
         *
         * @type {Job}
         */
        this.job = job;
        /**
         * This is a list of absolute paths to temporary tag files and
         * manifests. These go into the system temp directory during
         * bagging, and the bagger deletes them when it's done.
         *
         * @type {Array<string>}
         */
        this.tmpFiles = [];
        /**
         * This is a list of {@link BagItFile} objects that were packed
         * into the bag. This includes payload files, manifests, tag files
         * and tag manifests.
         *
         * @type {BagItFile}
         */
        this.bagItFiles = [];
        /**
         * The formatWriter is a plugin used to write the bag onto disk.
         * For example, a bag being written into a directory on the file
         * system will use the FileSystemWriter plugin. A bag being written
         * to a tar file will use the TarWriter plugin, etc.
         *
         * The bagger chooses the formatWriter at runtime, based on
         * heuristics such as the file extension of the output file.
         *
         * @type {object}
         */
        this.formatWriter = null;

        // private
        this._pathToTrim = null;
    }

    /**
     * This ensures the packaging operation is valid before the bagger
     * tries to run it.
     *
     * @returns {boolean} - True or false, indicating whether or not
     * the job is valid.
     */
    validatePackagingOperation() {
        this.errors = {};
        var packOp = this.job.packageOp;
        if (!packOp.validate()) {
            packOp.result.errors.push("Job is not valid.");
            for(var [key, value] of Object.entries(this.job.errors)) {
                packOp.result.errors.push(`${key}: ${value}`);
            }
            packOp.result.finish();
            return false;
        }
        return true;
    }

    /**
     * This creates the bag based in the BagItProfile and other info specified
     * in the {@link Job} object. See the documentation for the {@link Bagger}
     * class for an example of how to use this method.
     *
     */
    async create() {
        var packOp = this.job.packageOp;
        this.emit('packageStart', `Starting to build ${packOp.packageName}`);
        packOp.result = new OperationResult('bagging', 'DART bagger');
        packOp.result.filepath = packOp.outputPath;
        packOp.result.start();

        if (!this.validatePackagingOperation()) {
            this._finish();
            this.emit('error', Context.y18n.__('Validation error in packaging operation.'));
            return false;
        }

        try {
            this._initWriter();
        } catch (ex) {
            packOp.result.errors.push(ex.toString());
            this._finish();
            this.emit('error', ex.toString());
            return false;
        }

        var bagger = this;
        /**
         * @event Bagger#error
         *
         * @description Emits a string describing an error encountered
         * during the bagging process. Processing may continue after
         * some types of errors.
         *
         * @type {string}
         */
        this.formatWriter.on('error', function(err) {
            packOp.result.errors.push(err);
            packOp.result.finish();
            bagger.emit('error', err);
        });
        /**
         * @event Bagger#fileAdded
         *
         * @description Emits a {@link BagItFile} object describing a
         * file that was just written into the bag.
         *
         * @type {BagItFile}
         */
        this.formatWriter.on('fileAdded', function(bagItFile, percentComplete) {
            bagger.emit('fileAdded', bagItFile, percentComplete);
        });

        await this._addPayloadFiles();

        if (!packOp.result.hasErrors()) {
            await this._addTagFiles();
        }
        if (!packOp.result.hasErrors()) {
            await this._addManifests();
        }
        if (!packOp.result.hasErrors()) {
            await this._addTagManifests();
        }

        bagger._finish();
    }

    /**
     * This adds payload files to the bag.
     */
    async _addPayloadFiles() {
        var packOp = this.job.packageOp;
        for (var absPath of packOp.sourceFiles) {
            var relDestPath = this._getRelDestPath(absPath);
            var stats = fs.statSync(absPath);
            if (stats.isFile()) {
                await this._addFile(absPath, relDestPath, stats);
            } else if (stats.isDirectory()) {
                // Wait until entire directory is added before
                // attaching finish listener, else queue will
                // drain more than once.
                this.formatWriter.directories[relDestPath] = stats;
                await this._addDirectory(absPath, relDestPath, stats);
            }
        }
        var bagger = this;
        return new Promise( function(resolve, reject) {
            bagger.formatWriter.once('finish', function() {
                resolve();
            });
        });
    }

    /**
     * Adds a tag file to the bag, writing out all of the tag
     * name-value pairs.
     *
     * @private
     */
    async _addTagFiles(bagItFiles) {
        this._setBagInfoAutoValues();
        var profile = this.job.bagItProfile;
        for (let tagFileName of profile.tagFileNames()) {
            let content = profile.getTagFileContents(tagFileName);
            let tmpFile = path.join(os.tmpdir(), tagFileName + Date.now());
            this.tmpFiles.push(tmpFile);
            if (!fs.existsSync(path.dirname(tmpFile))) {
                mkdirp.sync(path.dirname(tmpFile), { mode: 0o755 });
            }
            fs.writeFileSync(tmpFile, content);
            var stats = fs.statSync(tmpFile);
            await this._addFile(tmpFile, tagFileName, stats);
        }
        let bagger = this;
        return new Promise(function(resolve, reject) {
            bagger.formatWriter.once('finish', function() {
                resolve();
            });
        });
    }

    /**
     * Adds payload manifests to the bag.
     *
     * @private
     */
    async _addManifests() {
        let bagger = this;
        let promise = new Promise(function(resolve, reject) {
            bagger.formatWriter.once('finish', function() {
                resolve();
            });
        });
        await this._writeManifests('payload');
        return promise;
    }

    /**
     * Adds tag manifests to the bag.
     *
     * @private
     */
    async _addTagManifests() {
        let bagger = this;
        let promise = new Promise(function(resolve, reject) {
            bagger.formatWriter.once('finish', function() {
                resolve();
            });
        });
        await bagger._writeManifests('tag');
        return promise;
    }


    /**
     * Adds an entire directory to the bag's payload.
     *
     * @private
     */
    _addDirectory(absPath, relDestPath, stats) {
        let bagger = this;
        let packOp = this.job.packageOp;
        let fsReaderClass = PluginManager.findById(Constants.FILESYSTEM_READER_UUID);
        let fsReader = new fsReaderClass(absPath);
        fsReader.on('entry', function(entry) {
            let fullPath = path.join(absPath, entry.relPath);
            let relDestPath = bagger._getRelDestPath(fullPath);
            if (entry.fileStat.isFile()) {
                bagger._addFile(fullPath, relDestPath, entry.fileStat);
            } else if (entry.fileStat.isDirectory()) {
                bagger.formatWriter.directories[relDestPath] = entry.fileStat;
            }
        });
        fsReader.on('error', function(err) {
            packOp.result.errors.push(err.toString());
            bagger.emit('error', err);
        });
        fsReader.list();
        return new Promise(function(resolve, reject) {
            fsReader.on('end', function(fileCount) {
                resolve(fileCount);
            });
        });
    }

    /**
     * Adds a single file to the bag's payload.
     *
     * @private
     */
    _addFile(absPath, relDestPath, stats) {
        if (os.platform() === 'win32' && this.formatWriter.constructor.name === 'TarWriter') {
            relDestPath = relDestPath.replace(/\\/g, '/');
        }
        var profile = this.job.bagItProfile;
        let bagItFile = new BagItFile(absPath, relDestPath, stats);

        let manifestAlgs = profile.chooseManifestAlgorithms('manifest');
        if (!relDestPath.startsWith('data/')) {
            // This is a tag file, not a payload file.
            manifestAlgs = profile.chooseManifestAlgorithms('tagmanifest');
        }
        let cryptoHashes = this._getCryptoHashes(bagItFile, manifestAlgs);
        this.formatWriter.add(bagItFile, cryptoHashes);
        this.bagItFiles.push(bagItFile);
        return new Promise(function(resolve) {
            resolve(bagItFile);
        });
    }

    /**
     * This chooses the plugin that will be used when writing the bag
     * to disk. Tarred bags will use the TarWriter plugin, unserialized
     * bags will use the FileSystemWriter plugin, etc.
     *
     * @private
     */
    _initWriter() {
        if (this.formatWriter) {
            // Don't create another because it will overwrite our output file.
            return;
        }
        var outputPath = this.job.packageOp.outputPath;
        var parentDir = path.dirname(outputPath);
        let fileExtension = path.extname(outputPath);
        if (fileExtension === '') {
            fileExtension = 'directory';
            parentDir = outputPath;
        }
        if (!fs.existsSync(outputPath)) {
            mkdirp.sync(parentDir, { mode: 0o755 });
        }
        var plugins = PluginManager.canWrite(fileExtension);
        if (!plugins || plugins.length == 0) {
            throw Context.y18n.__("DART cannot find a plugin that knows how to write %s files.", fileExtension);
        }
        // plugins[0] is a writer plugin (a class) with a constructor
        // that takes pathToBag as its sole param.
        this.formatWriter = new plugins[0](outputPath);
        this.formatWriter.init();
    }

    /**
     * Given a file's path on disk this returns the relative path that
     * file will occupy inside the bag.
     *
     * @param {string} absPath - The path of the source file on disk.
     *
     * @returns {string} - The path the file will occupy inside the bag.
     *
     * @private
     */
    _getRelDestPath(absPath) {
        var trimmedPath = this._trimAbsPath(absPath);
        var relDestPath = 'data' + trimmedPath;
        if (os.platform() == 'win32') {
            relDestPath = 'data' + Util.normalizeWindowsPath(trimmedPath);
        }
        return relDestPath;
    }

    /**
     * Trim common path prefixes. We call this before calculating the
     * relDestPath. See {@link Util.findCommonPathPrefix} and
     * {@link PackageOperation.trimLeadingPaths}.
     *
     * @private
     */
    _trimAbsPath(absPath) {
        let trimPath = this._getTrimPath();
        let trimmed = absPath;
        if (trimPath) {
            if (os.platform() == 'win32') {
                trimPath = trimPath.replace(/\\/g, '\\\\');
            }
            let pattern = new RegExp('^' + trimPath);
            trimmed = path.sep + absPath.replace(pattern, '');
        }
        return trimmed;
    }

    /**
     * Returns the common leading path that we can trim from source
     * files before bagging. See {@link Util.findCommonPathPrefix} and
     * {@link PackageOperation.trimLeadingPaths}.
     *
     * @private
     */
    _getTrimPath() {
        if (this._pathToTrim === null) {
            if (this.job.packageOp.trimLeadingPaths()) {
                this._pathToTrim = Util.findCommonPathPrefix(this.job.packageOp.sourceFiles);
            } else {
                this._pathToTrim = '';
            }
        }
        return this._pathToTrim;
    }

    /**
     * Sets some automatic values in the bag-info.txt file, including
     * Bagging-Date, Bagging-Software, Payload-Oxum and
     * BagItProfileIdentifier
     *
     * @private
     */
    _setBagInfoAutoValues() {
        var profile = this.job.bagItProfile;
        var baggingDate = profile.firstMatchingTag('tagName', 'Bagging-Date');
        if (baggingDate) {
            baggingDate.userValue = dateFormat(Date.now(), 'isoUtcDateTime');
        }

        var baggingSoftware = profile.firstMatchingTag('tagName', 'Bagging-Software');
        if (baggingSoftware) {
            baggingSoftware.userValue = Context.dartVersion();
        }

        // This is an odd one, because the bagit-profiles spec at
        // https://bagit-profiles.github.io/bagit-profiles-specification/
        // says it's required, and yet the example specs do not require
        // or even this tag.
        var profileIdentifier = profile.firstMatchingTag('tagName', 'BagIt-Profile-Identifier')
        if (profileIdentifier == null) {
            profileIdentifier = new TagDefinition({
                id: Util.uuid4(),
                tagFile: "bag-info.txt",
                tagName: "BagIt-Profile-Identifier",
                required: true
            });
            profile.tags.push(profileIdentifier)
        }
        profileIdentifier.userValue = profile.bagItProfileInfo.bagItProfileIdentifier || 'https://example.com/profile.json';

        var fileCount = 0;
        var byteCount = 0;
        var payloadOxum = profile.firstMatchingTag('tagName', 'Payload-Oxum');
        if (payloadOxum) {
            for (let f of this.bagItFiles) {
                if (f.isPayloadFile()) {
                    fileCount += 1;
                    byteCount += Number(f.size);
                }
            }
            payloadOxum.userValue = `${byteCount}.${fileCount}`;
        }

        var bagSize = profile.firstMatchingTag('tagName', 'Bag-Size');
        if (bagSize && payloadOxum) {
            bagSize.userValue = Util.toHumanSize(byteCount);
        }
    }

    /**
     * Deletes temporary manifest and tag files that were generated during
     * the bagging process.
     *
     * @private
     */
    _deleteTempFiles() {
        for (let f of this.tmpFiles) {
            if (fs.existsSync(f)) {
                fs.unlinkSync(f);
            }
        }
    }

    /**
     * Records results of the bagging operation, cleans up temp files,
     * and emits the 'finish' event.
     *
     * @private
     */
    _finish() {
        var result = this.job.packageOp.result;
        result.finish();
        if (fs.existsSync(result.filepath)) {
            let stat = fs.statSync(result.filepath);
            if (stat.isDirectory()) {
                const sum = (total, file) => total + Number(file.size);
                result.filesize = this.bagItFiles.reduce(sum, 0);
            } else {
                result.filesize = Number(stat.size);
            }
        }
        this._deleteTempFiles();
        /**
         * @event Bagger#finish
         *
         * @description Emits an empty event indicating the bagger has
         * completed its work. Check bagger.job.packageOp.result
         * for errors.
         *
         */
        this.emit('finish');
    }


    /**
     * Adds manifests of the specified type to the bag.
     *
     * @param {string} payloadOrTag - Describes whether to add payload
     * or tag manifests.
     *
     * @private
     */
    async _writeManifests(payloadOrTag) {
        var profile = this.job.bagItProfile;
        var manifestAlgs = profile.chooseManifestAlgorithms('manifest');
        var fileNamePrefix = 'manifest';
        if (payloadOrTag == 'tag') {
            manifestAlgs = profile.chooseManifestAlgorithms('tagmanifest');
            fileNamePrefix = 'tagmanifest';
        }
        if (manifestAlgs.length == 0) {
            this.formatWriter.emit('finish');
            return;
        }
        for (let algorithm of manifestAlgs) {
            var manifestName = `${fileNamePrefix}-${algorithm}.txt`;
            let tmpFile = path.join(os.tmpdir(), manifestName + Date.now());
            this.tmpFiles.push(tmpFile);
            var fd = fs.openSync(tmpFile, 'w')
            for (let bagItFile of this.bagItFiles) {
                if (payloadOrTag === 'payload' && !bagItFile.isPayloadFile()) {
                    continue;
                }
                if (payloadOrTag === 'tag' && (bagItFile.isPayloadFile() || bagItFile.isTagManifest())) {
                    continue;
                }
                let digest = bagItFile.checksums[algorithm];
                fs.writeSync(fd, `${digest} ${bagItFile.relDestPath}\n`);
            }
            fs.closeSync(fd);
            var stats = fs.statSync(tmpFile);
            await this._addFile(tmpFile, manifestName, stats);
        }
    }

    /**
     * Returns a list of cryptographic hash objects that must be calculated
     * on a file as it's written into the bag. DART can calculate multiple
     * digests on a file during a single write.
     *
     * @param {BagItFile} bagItFile - The BagItFile on which to calculate
     * the hash digest.
     *
     * @param {Array<string>} algorithms - The names of the algorithms to
     * calculate. For example, ['md5', 'sha256', 'sha512']. This info comes
     * from the manifestsRequired and tagManifestsRequired properties of the
     * BagItProfile.
     *
     * @returns {Array<object>} - An array of Node.js crypto.Hash objects.
     *
     * @private
     */
    _getCryptoHashes(bagItFile, algorithms) {
        let hashes = [];
        for (let algorithm of algorithms) {
            hashes.push(bagItFile.getCryptoHash(algorithm));
        }
        return hashes;
    }
}

module.exports.Bagger = Bagger;
