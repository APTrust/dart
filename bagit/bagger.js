const { BagItFile } = require('./bagit_file');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const EventEmitter = require('events');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const os = require('os');
const { OperationResult } = require('../core/operation_result');
const { PluginManager } = require('../plugins/plugin_manager');

class Bagger extends EventEmitter {
    constructor(job) {
        super();
        this.job = job;
        // Temp copies of tag files and manifests.
        // We need to clean these up when we're done.
        this.tmpFiles = [];
        this.formatWriter = null;
    }

    initOutputDir() {
        var packOp = this.job.packagingOperation;
        if (!fs.existsSync(packOp.outputPath)) {
            var opts = { mode: 0o755 };
            if (path.extname(packOp.outputPath) == '') {
                Context.logger.info(`Creating directory ${packOp.outputPath}`)
                mkdirp.sync(packOp.outputPath, opts);
            } else if (!fs.existsSync(path.dirname(packOp.outputPath))) {
                Context.logger.info(`Creating directory ${path.dirname(packOp.outputPath)}`);
                mkdirp.sync(path.dirname(packOp.outputPath), opts);
            }
        }
    }

    validateJob() {
        var jobValidationResult = this.job.validate();
        if (!jobValidationResult.isValid()) {
            packOp.error = "Job is not valid.";
            for(var key of Object.keys(jobValidationResult.errors)) {
                var err = jobValidationResult.errors[key];
                packOp.error += `\n${key}: ${err}`;
            }
            packOp.completed = Date.now();
            packOp.succeeded = false;
            return false;
        }
        return true;
    }

    create() {
        var packOp = this.job.packagingOperation;
        this.emit('packageStart', `Starting to build ${packOp.packageName}`);
        packOp.result = new OperationResult('bagging', 'DART bagger');
        packOp.result.filename = packOp.outputPath;
        packOp.started = Date.now();
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
        this.formatWriter.on('finish', function() {
            console.log(bagger.formatWriter.pathToTarFile);
            bagger.emit('finish');
        });
        this.initOutputDir();
        this.addPayloadFiles()
    }

    addPayloadFiles() {
        var bagger = this;
        var fsReaderClass = PluginManager.findById(Constants.FILESYSTEM_READER_UUID);
        var packOp = this.job.packagingOperation;
        for (var absPath of packOp.sourceFiles) {
            console.log(`Adding ${absPath}`);
            var relDestPath = this._getRelDestPath(absPath);
            var stats = fs.statSync(absPath);
            if (stats.isFile()) {
                console.log(`Adding from file: ${absPath}`);
                bagger._addPayloadFile(absPath, relDestPath, stats);
            } else if (stats.isDirectory()) {
                let fsReader = new fsReaderClass(absPath);
                fsReader.on('entry', function(entry) {
                    let fullPath = path.join(absPath, entry.relPath);
                    if(entry.fileStat.isFile()) {
                        console.log(`Adding ${fullPath}`);
                        bagger._addPayloadFile(fullPath, entry.relPath, entry.fileStat);
                    } else {
                        console.log(`Ignoring ${fullPath}`);
                    }
                });
                fsReader.on('error', function(err) {
                    packOp.result.error += err.toString();
                });
                fsReader.on('end', function(fileCount) {
                    // Do we need to do anything with fileCount?
                    console.log(`Done reading ${absPath}`);
                });
                fsReader.list();
            }
        }
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

    _addPayloadFile(absPath, relDestPath, stats) {
        let bagItFile = new BagItFile(absPath, relDestPath, stats);
        let cryptoHashes = this._getCryptoHashes(bagItFile, this.job.bagItProfile.manifestsRequired);
        this.formatWriter.add(bagItFile, cryptoHashes);
        return bagItFile;
    }

    _getRelDestPath(absPath) {
        var relDestPath = 'data' + absPath;
        if (os.platform == 'win32') {
            relDestPath = 'data' + Util.normalizeWindowsPath(absPath);
        }
        return relDestPath;
    }

    addTagFiles(bagItFiles) {
        var packOp = this.job.packagingOperation;
        // Write to temp file, then copy into packager.
    }

    addManifests(bagItFiles) {
        var packOp = this.job.packagingOperation;
        // Write to temp file, then copy into packager.
    }

    addTagManifests(bagFiles) {
        var packOp = this.job.packagingOperation;
        // Write to temp file, then copy into packager.
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
