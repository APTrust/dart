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
const { Validator } = require('../../bagit/validator');
const { Util } = require('../../core/util');

// We're reading output from a Golang program, which uses "\n"
// as the newline character when printing to STDOUT on all
// platforms, including Windows. See:
// https://golang.org/src/fmt/print.go?s=7595:7644#L253
const NEWLINE = "\n";
//const NEWLINE = require('os').EOL;

const name = "APTrust BagIt Provider";
const description = "EasyStore's builtin bagging libary."
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
        try {
            var bagger = new Bagger(this.job, this.emitter);
            var validator = new Validator(bagger.bagPath, this.job.bagItProfile, this.emitter);
            this.emitter.emit('start', 'Bagging files...');
            this.attachListeners(bagger, validator);
            bagger.create();
        } catch (ex) {
            this.emitter.emit('error', ex);
            console.error(ex);
        }
    }

    attachListeners(bagger, validator) {
        var packager = this;
        if (!packager.handlersAdded) {
            packager.emitter.on('packageComplete', function(succeeded, message) {
                if (succeeded) {
                    packager.job.packagedFile = bagger.bagPath;
                    validator.validate();
                } else {
                    packager.emitter.emit('complete', false, message)
                }
            });
            packager.emitter.on('validateComplete', function(succeeded, message) {
                if (succeeded) {
                    for(var manifest of validator.payloadManifests) {
                        packager.dumpManifest(manifest);
                    }
                    packager.emitter.emit('complete', true, `Bag created at ${packager.job.packagedFile}`)
                } else {
                    packager.emitter.emit('complete', false, message)
                }
            });
            packager.handlersAdded = true;
        }
    }

    getManifestDirName() {
        var dir = app.getPath('userData');
        return path.join(dir, 'manifests');
    }

    ensureManifestDir() {
        var manifestDir = this.getManifestDirName();
        if (!fs.existsSync(manifestDir)){
            fs.mkdirSync(manifestDir);
        }
    }

    // Param manifest is an object of type BagItFile that contains
    // manifest data. The manifest entries we write here may not
    // be in the same order as on the manifest in the bagger.
    dumpManifest(manifest) {
        this.ensureManifestDir();
        var match = manifest.relDestPath.match(/manifest-(\w+).txt$/);
        var filename = `${this.job.id}_${match[1]}_${new Date().getTime()}.txt`;
        var outputPath = path.join(this.getManifestDirName(), filename);
        //console.log(outputPath);
        var outputFile = fs.createWriteStream(outputPath, { mode: 0o644 });
        outputFile.setDefaultEncoding('utf-8');
        for (var filename of manifest.keyValueCollection.sortedKeys()) {
            var checksum = manifest.keyValueCollection.first(filename);
            //console.log(`${checksum} ${filename}\n`);
            outputFile.write(`${checksum} ${filename}\n`);
        }
        outputFile.end();
    }

}

module.exports.Provider = BagIt;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
module.exports.format = format;
module.exports.formatMimeType = formatMimeType;
