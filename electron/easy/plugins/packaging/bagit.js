const electron = require('electron');
const app = (process.type === 'renderer') ? electron.remote.app : electron.app;
const { spawn } = require('child_process');
const decoder = new TextDecoder("utf-8");
const fs = require('fs');
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');
const tar = require('tar-stream')

const { AppSetting } = require('../../core/app_setting');
const { Bagger } = require('../../bagit/bagger');
const constants = require('../../bagit/constants');
const log = require('../../core/log');
const { Validator } = require('../../bagit/validator');
const { Util } = require('../../core/util');

// We're reading output from a Golang program, which uses "\n"
// as the newline character when printing to STDOUT on all
// platforms, including Windows. See:
// https://golang.org/src/fmt/print.go?s=7595:7644#L253
const NEWLINE = "\n";
//const NEWLINE = require('os').EOL;

const name = "APTrust BagIt Provider";
const description = "DART's builtin bagging libary."
const version = "0.2";
const format = "BagIt";
const formatMimeType = "";

class BagIt {

    /**
     * Custom packager.
     * @constructor
     * @param {object} job - The job object. See easy/job.js.
     * @param {object} emitter - An Node event object that can emit events
     * @returns {object} - A new custom packager.
     */
    constructor(job, emitter) {
        this.job = job;
        this.emitter = emitter;
        this.handlersAdded = false;
    }

    /**
     * Returns a map with descriptive info about this provider.
     * @returns {object} - Contains descriptive info about this provider.
     */
     describe() {
         return { name: name,
                  description: description,
                  version: version,
                  format: format,
                  formatMimeType: formatMimeType
                };
     }

    /**
     * Assembles all job.files into a package (e.g. a zip file,
     * tar file, rar file, etc.).
     */
    packageFiles() {
        this.job.packagedFile = "";
        var bagger = null;
        var validator = null;
        try {
            this.ensureBaggingDir();
            bagger = new Bagger(this.job, this.emitter);
            validator = new Validator(bagger.bagPath, this.job.bagItProfile, this.emitter);
            this.emitter.emit('start', 'Bagging files...');
            this.attachListeners(bagger, validator);
            bagger.create();
        } catch (ex) {
            var errStr = ex.toString();
            var msg = errStr;
            if (errStr.includes('ENOENT')) {
                msg = `Cannot find one of the files to be bagged: ${errStr}`
            } else if (errStr.includes('ENOSPC')) {
                msg = `Ran out of disk space while writing bag. ${errStr}`
            }
            this.emitter.emit('error', msg);
            log.error(ex);
            if (bagger != null && bagger.errors) {
                log.error("Bagger errors follow");
                for (var e of bagger.errors) {
                    log.error(e);
                }
            }
            if (validator != null && validator.errors) {
                log.error("Validator errors follow");
                for (var e of validator.errors) {
                    log.error(e);
                }
            }
            console.error(msg);
        }
    }

    attachListeners(bagger, validator) {
        var packager = this;
        if (!packager.handlersAdded) {
            packager.emitter.on('packageComplete', function(succeeded, message) {
                if (succeeded) {
                    packager.job.packagedFile = bagger.bagPath;
                    log.info("Packaging completed successfully.");
                    validator.validate();
                } else {
                    log.error("Packaging completed with error.");
                    log.error(message);
                    packager.emitter.emit('complete', false, message)
                    packager.deleteBag();
                }
            });
            packager.emitter.on('validateComplete', function(succeeded, message) {
                if (succeeded) {
                    log.info("Validation completed successfully.");
                    for(var manifest of validator.payloadManifests) {
                        packager.dumpManifest(manifest);
                    }
                    packager.emitter.emit('complete', true, `Bag created at ${packager.job.packagedFile}`)
                } else {
                    log.error("Validation completed with error.");
                    log.error(message);
                    packager.emitter.emit('complete', false, message)
                    packager.deleteBag();
                }
            });
            packager.handlersAdded = true;
        }
    }

    // Delete the bag. We only do this if packaging or validation failed.
    deleteBag() {
        if (this.job.packagedFile && fs.existsSync(this.job.packagedFile)) {
            try {
                fs.unlink(this.job.packagedFile);
                log.info(`Deleted ${this.job.packagedFile} after packaging and/or validation errors.`);
            } catch (ex) {
                log.error(`Failed to delete invalid bag at ${this.job.packagedFile}: ${ex.toString()}`);
            }
            this.job.packagedFile = '';
        }
    }

    ensureBaggingDir() {
        if (!fs.existsSync(this.job.baggingDirectory)) {
            log.info(`Creating bagging directory ${this.job.baggingDirectory}`);
            mkdirp.sync(this.job.baggingDirectory, 0o755);
        }
    }

    getManifestDirName() {
        var dir = app.getPath('userData');
        return path.join(dir, 'manifests');
    }

    ensureManifestDir() {
        var manifestDir = this.getManifestDirName();
        if (!fs.existsSync(manifestDir)) {
            log.info(`Creating manifest directory ${manifestDir}`);
            fs.mkdirSync(manifestDir, 0o755);
        }
    }

    // Param manifest is an object of type BagItFile that contains
    // manifest data. The manifest entries we write here may not
    // be in the same order as on the manifest in the bagger.
    dumpManifest(manifest) {
        var outputPath = null;
        try {
            this.ensureManifestDir();
            var match = manifest.relDestPath.match(/manifest-(\w+).txt$/);
            var filename = `${this.job.id}_${match[1]}_${new Date().getTime()}.txt`;
            outputPath = path.join(this.getManifestDirName(), filename);
            log.info(`Writing manifest to ${outputPath}`);
            var outputFile = fs.createWriteStream(outputPath, { mode: 0o644 });
            outputFile.setDefaultEncoding('utf-8');
            for (var filename of manifest.keyValueCollection.sortedKeys()) {
                var checksum = manifest.keyValueCollection.first(filename);
                outputFile.write(`${checksum} ${filename}\n`);
            }
            outputFile.end();
        } catch (ex) {
            var message = `Error exporting manifest ${outputPath}: ${ex}`
            log.error(message);
            this.emitter.emit('error', message);
        }
    }

}

module.exports.Provider = BagIt;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
module.exports.format = format;
module.exports.formatMimeType = formatMimeType;
