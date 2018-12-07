const { BagItFile } = require('./bagit_file');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const dateFormat = require('dateformat');
const EventEmitter = require('events');
const fs = require('fs');
const { KeyValueCollection } = require('./key_value_collection');
const path = require('path');
const os = require('os');
const { OperationResult } = require('../core/operation_result');
const { PluginManager } = require('../plugins/plugin_manager');

/**
 * Bagger creates a bag based on a BagItProfile.
 *
 * @param {Job} job - A job object that includes a
 * {@link PackagingOperation} describing a number of files to be
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
 *    // Check the contents of job.packagingOperation.result.errors
 *    // for details of what went wrong.
 * });
 * bagger.on('finish', function() {
 *     // Do whatever you want when the bag is complete.
 *     // If needed, you can inspect the contents of the bagItFiles
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
    }

    validateJob() {
        var jobValidationResult = this.job.validate();
        if (!jobValidationResult.isValid()) {
            packOp.error = "Job is not valid.";
            for(var key of Object.keys(jobValidationResult.errors)) {
                var err = jobValidationResult.errors[key];
                packOp.error += `\n${key}: ${err}`;
            }
            packOp.completed = dateFormat(Date.now(), 'isoUtcDateTime');
            packOp.succeeded = false;
            return false;
        }
        return true;
    }

    async create() {
        var packOp = this.job.packagingOperation;
        this.emit('packageStart', `Starting to build ${packOp.packageName}`);
        packOp.result = new OperationResult('bagging', 'DART bagger');
        packOp.result.filename = packOp.outputPath;
        packOp.result.started = dateFormat(Date.now(), 'isoUtcDateTime');
        if (!this.validateJob()) {
            return false;
        }
        try {
            this._initWriter();
        } catch (ex) {
            packOp.result.error = ex.toString();
            return false;
        }
        var bagger = this;
        this.formatWriter.on('error', function(err) {
            bagger.job.packagingOperation.error += error;
        });
        this.formatWriter.on('fileAdded', function(bagItFile) {
            bagger.emit('fileAdded', bagItFile);
        });

        await this.addPayloadFiles();
        await this.addTagFiles();
        await this.addManifests();
        await this.addTagManifests();
        this.finish();
    }

    async addPayloadFiles() {
        var packOp = this.job.packagingOperation;
        for (var absPath of packOp.sourceFiles) {
            var relDestPath = this._getRelDestPath(absPath);
            var stats = fs.statSync(absPath);
            if (stats.isFile()) {
                await this._addFile(absPath, relDestPath, stats);
            } else if (stats.isDirectory()) {
                // Wait until entire directory is added before
                // attaching finish listener, else queue will
                // drain more than once.
                await this._addDirectory(absPath);
            }
        }
        var bagger = this;
        return new Promise( function(resolve, reject) {
            bagger.formatWriter.once('finish', function() {
                resolve();
            });
        });
    }

    _addDirectory(absPath) {
        let bagger = this;
        let packOp = this.job.packagingOperation;
        let fsReaderClass = PluginManager.findById(Constants.FILESYSTEM_READER_UUID);
        let fsReader = new fsReaderClass(absPath);
        fsReader.on('entry', function(entry) {
            let fullPath = path.join(absPath, entry.relPath);
            if(entry.fileStat.isFile()) {
                let relDestPath = path.join('data', entry.relPath);
                if (bagger.formatWriter.constructor.name === 'TarWriter') {
                    // For tar files, use forward slash, even on Windows.
                    relDestPath = 'data/' + entry.relPath;
                }
                bagger._addFile(fullPath, relDestPath, entry.fileStat);
            }
        });
        fsReader.on('error', function(err) {
            packOp.result.error += err.toString();
        });
        fsReader.list();
        return new Promise(function(resolve, reject) {
            fsReader.on('end', function(fileCount) {
                resolve(fileCount);
            });
        });
    }

    _initWriter() {
        if (this.formatWriter) {
            // Don't create another because it will overwrite our output file.
            return;
        }
        var outputPath = this.job.packagingOperation.outputPath;
        var fileExtension = path.extname(outputPath);
        if (fileExtension === '') {
            fileExtension = 'directory';
        }
        var plugins = PluginManager.canWrite(fileExtension);
        if (!plugins) {
            throw `No plugins know how to write ${fileExtension}`
        }
        // plugins[0] is a writer plugin (a class) with a constructor
        // that takes pathToBag as its sole param.
        this.formatWriter = new plugins[0](outputPath);
    }

    _addFile(absPath, relDestPath, stats) {
        let bagItFile = new BagItFile(absPath, relDestPath, stats);
        let cryptoHashes = this._getCryptoHashes(bagItFile, this.job.bagItProfile.manifestsRequired);
        this.formatWriter.add(bagItFile, cryptoHashes);
        this.bagItFiles.push(bagItFile);
        return new Promise(function(resolve) {
            resolve(bagItFile);
        });
    }

    _getRelDestPath(absPath) {
        var relDestPath = 'data' + absPath;
        if (os.platform == 'win32') {
            relDestPath = 'data' + Util.normalizeWindowsPath(absPath);
        }
        return relDestPath;
    }

    async addTagFiles(bagItFiles) {
        this.setBagInfoAutoValues();
        var profile = this.job.bagItProfile;
        for (let tagFileName of profile.tagFileNames()) {
            let content = profile.getTagFileContents(tagFileName);
            let tmpFile = path.join(os.tmpdir(), tagFileName + Date.now());
            this.tmpFiles.push(tmpFile);
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

    // Set some automatic values in the bag-info.txt file.
    setBagInfoAutoValues() {
        var profile = this.job.bagItProfile;
        var baggingDate = profile.firstMatchingTag('tagName', 'Bagging-Date');
        baggingDate.userValue = dateFormat(Date.now(), 'isoUtcDateTime');
        var baggingSoftware = profile.firstMatchingTag('tagName', 'Bagging-Software');
        baggingSoftware.userValue = Context.dartVersion();

        var fileCount = 0;
        var byteCount = 0;
        var payloadOxum = profile.firstMatchingTag('tagName', 'Payload-Oxum');
        for (let f of this.bagItFiles) {
            if (f.isPayloadFile()) {
                fileCount += 1;
                byteCount += f.size;
            }
        }
        payloadOxum.userValue = `${byteCount}.${fileCount}`;
    }

    // Call this on finish
    _deleteTempFiles() {
        for (let f of this.tmpFiles) {
            if (fs.existsSync(f)) {
                fs.unlinkSync(f);
            }
        }
    }

    async addManifests(bagItFiles) {
        await this._writeManifests('payload');
        let bagger = this;
        return new Promise(function(resolve, reject) {
            bagger.formatWriter.once('finish', function() {
                resolve();
            });
        });
    }

    async addTagManifests(bagFiles) {
        let bagger = this;
        await bagger._writeManifests('tag');
        return new Promise(function(resolve, reject) {
            bagger.formatWriter.once('finish', function() {
                resolve();
            });
        });
    }


    finish() {
        var result = this.job.packagingOperation.result;
        result.completed = dateFormat(Date.now(), 'isoUtcDateTime');
        result.succeeded = !result.error;
        if (fs.existsSync(result.filename)) {
            let stat = fs.statSync(result.filename);
            result.filesize = stat.size;
        }
        this._deleteTempFiles();
        this.emit('finish');
    }


    async _writeManifests(payloadOrTag) {
        var profile = this.job.bagItProfile;
        var manifestAlgs = profile.manifestsRequired;
        var fileNamePrefix = 'manifest';
        if (payloadOrTag == 'tag') {
            manifestAlgs = profile.tagManifestsRequired;
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

    _getCryptoHashes(bagItFile, algorithms) {
        let hashes = [];
        for (let algorithm of algorithms) {
            hashes.push(bagItFile.getCryptoHash(algorithm));
        }
        return hashes;
    }
}

module.exports.Bagger = Bagger;
