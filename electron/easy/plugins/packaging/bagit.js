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
const { Util } = require('../../core/util');

// We're reading output from a Golang program, which uses "\n"
// as the newline character when printing to STDOUT on all
// platforms, including Windows. See:
// https://golang.org/src/fmt/print.go?s=7595:7644#L253
const NEWLINE = "\n";
//const NEWLINE = require('os').EOL;

const name = "APTrust BagIt Provider";
const description = "Provides access to the APTrust command-line bagging library."
const version = "0.1";
const format = "BagIt";
const formatMimeType = "";

/*
  TODO: Implement bagger in JavaScript. Will need the following:

  1. Crypto: https://nodejs.org/api/crypto.html#crypto_class_hash
     Md5 example: https://gist.github.com/kitek/1579117

  2. Tar: https://www.npmjs.com/package/archiver
     Supports streams and zip.

  3. Multiwriter candidates:
     https://github.com/mafintosh/multi-write-stream
     https://www.npmjs.com/package/multiwriter

     Or use builtin Node streams and pipes, as described here:
     https://stackoverflow.com/questions/17957525/multiple-consumption-of-single-stream
*/

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
        var packager = this;
        packager.job.packagedFile = "";
        try {
            // Make sure the bagging directory exists
            var baggingDir = AppSetting.findByName("Bagging Directory").value;
            console.log("Creating" + baggingDir);
            mkdirp.sync(baggingDir, { mode: 0o755 });

            // Start the bagger executable
            // TODO: Set up the spawn env to include the PATH in which apt_create_bag resides.
            // Maybe that goes in AppSettings?
            var started = false;
            var fileCount = 0;
            var baggerProgram = this.getBaggerProgramPath();
            var bagger = spawn(baggerProgram, [ "--stdin" ]);

            bagger.on('error', (err) => {
                var msg = `Bagger ${baggerProgram} exited with error: ${err}`;
                if (String(err).includes("ENOENT")) {
                    msg += ". Make sure the program exists and is in your PATH.";
                }
                packager.emitter.emit('error', msg);
                console.log(msg);
                return;
            });

            bagger.on('exit', function (code, signal) {
                var msg = `Bagger failed with code ${code} and signal ${signal}`;
                var succeeded = false;
                if (code == 0) {
                    msg = 'Bagger completed successfully';
                    succeeded = true;
                }
                packager.dumpManifests();
                packager.emitter.emit('complete', succeeded, msg);
            });

            bagger.stdout.on('data', (data) => {
                if (started == false) {
                    packager.emitter.emit('start', 'Building bag...');
                    started = true;
                }
                var lines = decoder.decode(data).split(NEWLINE);
                for (var line of lines) {
                    if (line.startsWith('Adding')) {
                        fileCount += 1;
                        packager.emitter.emit('fileAddStart', line);
                    } else if (line.startsWith('Writing')) {
                        packager.emitter.emit('fileAddComplete', true, `Added ${fileCount} files`);
                        packager.emitter.emit('packageStart', line);
                    } else if (line.startsWith('Validating')) {
                        packager.emitter.emit('packageComplete', true, 'Finished packaging');
                        packager.emitter.emit('validateStart', line);
                    } else if (line.startsWith('Bag at')) {
                        var isValid = false;
                        if (line.endsWith("is valid")) {
                            isValid = true;
                        }
                        packager.emitter.emit('validateComplete', isValid, line);
                    } else if (line.startsWith('Created')) {
                        var filePath = line.substring(7);
                        packager.job.packagedFile = filePath.trim();
                    } else {
						console.log(line);
					}
                }
                // console.log(decoder.decode(data));
            });

            bagger.stderr.on('data', (data) => {
                var lines = decoder.decode(data).split(NEWLINE);
                for (var line of lines) {
                    packager.emitter.emit('error', line);
                }
            });


            bagger.stdin.write(JSON.stringify(packager.job));

        } catch (ex) {
            packager.emitter.emit('error', ex);
            console.error(ex);
        }
    }

    getBaggerProgramPath() {
        var baggerProgram = "";
        var setting = AppSetting.findByName("Path to Bagger");
        if (setting) {
            baggerProgram = setting.value;
        } else {
            if (os.platform == 'win32') {
                baggerProgram = "apt_create_bag.exe";
            } else {
                baggerProgram = "apt_create_bag";
            }
        }
        console.log("Bagger program: " + baggerProgram);
        return baggerProgram;
    }

    getManifestDirName() {
        var dir = app.getPath('userData');
        return path.join(dir, 'manifests');
    }

    ensureManifestDir() {
        var packager = this;
        var manifestDir = packager.getManifestDirName();
        if (!fs.existsSync(manifestDir)){
            fs.mkdirSync(manifestDir);
        }
    }

    dumpManifests() {
        // For each manifest listed in profile,
        // copy from bag or tar to special dir or to Electron Storage.
        // Throw exception if there is one, so the UI can show it.
        // This will cause performance problems for larger bags.
        // We wouldn't need this if we were creating the bag in JavaScript.
        var packager = this;
        packager.ensureManifestDir();
        if (packager.job.packagedFile.endsWith(".tar")) {
            return packager.dumpTarredManifests();
        } else if (packager.job.packagedFile.endsWith(".gzip")) {
            console.log("Dump manifests does not yet support gzip format")
        } else if (packager.job.packagedFile.endsWith(".tgz")) {
            console.log("Dump manifests does not yet support tgz format")
        } else if (packager.job.packagedFile.endsWith(".rar")) {
            console.log("Dump manifests does not yet support rar format")
        } else if (packager.job.packagedFile.endsWith(".zip")) {
            console.log("Dump manifests does not yet support zip format")
        } else {
            console.log("Dump manifests: unknown and unsupported format")
        }
    }
    dumpTarredManifests() {
        var packager = this;
        var extract = tar.extract();
        var filename = '';
        var data = '';
        var manifestDir = packager.getManifestDirName();

        extract.on('entry', function(header, stream, cb) {
            stream.on('data', function(chunk) {
                var isTagManifest = header.name.match(/tagmanifest-(\w+).txt$/) != null;
                var match = header.name.match(/manifest-(\w+).txt$/);
                if (match && !isTagManifest) {
                    filename = `${packager.job.id}_${match[1]}_${new Date().getTime()}.txt`;
                    console.log(filename);
                    data += chunk;
                }
            });

            stream.on('end', function() {
                if (filename != '') {
                    var fullFileName = path.join(manifestDir, filename);
                    fs.writeFileSync(fullFileName, data);
                    console.log(`Wrote manifest to ${fullFileName}`);
                    data = '';
                    filename = '';
                }
                cb();
            });

            //stream.resume();
        });

        extract.on('finish', function() {
            //fs.writeFile(filename, data);
        });

        fs.createReadStream(packager.job.packagedFile)
            //.pipe(zlib.createGunzip())
            .pipe(extract);
    }
}

module.exports.Provider = BagIt;
module.exports.name = name;
module.exports.description = description;
module.exports.version = version;
module.exports.format = format;
module.exports.formatMimeType = formatMimeType;
