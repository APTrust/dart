const async = require('async');
const { BagItFile } = require('./bagit_file');
const constants = require('./constants');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const stream = require('stream');
const tar = require('tar-stream');
const tmp = require('tmp');
const { Util } = require('../core/util');

const WRITE_AS_DIR = 'dir';
const WRITE_AS_TAR = 'tar';

// TODO: Remove TarWriter to separate file.
// TODO: Write validator.
// TODO: Extract manifests (or just make an extra copy after copyFile)

// writeIntoTarArchive is the function that the async queue
// will manage. When writing to a tar archive, we must add
// files one at a time.
function writeIntoTarArchive(data, done) {
    console.log(data);
    var writer = data.tar.entry(data.header, done);
    for (var h of data.hashes) {
        data.reader.pipe(h)
    }
    data.reader.pipe(writer);
}

class Bagger {

    constructor(job) {
        this.job = job;
        this.writeAs = WRITE_AS_DIR;
        this.bagPath = path.join(job.baggingDirectory, job.bagName);
        if (job.bagItProfile.mustBeTarred()) {
            this.bagPath += ".tar";
            this.writeAs = WRITE_AS_TAR;
        }
        this.files = [];
        this.errors = [];

        // Keep a list of temp files so we can clean them up
        // when we're done. These are tag files and manifests
        // that we copy into the bag.
        this.tmpFiles = [];

        // Async: factor back in the principles of synchronocity and chronology
        // that Node.js factored out.
        this.payloadQueue = async.queue(writeIntoTarArchive, 1);
        this.tagFileQueue = async.queue(writeIntoTarArchive, 1);
        this.manifestQueue = async.queue(writeIntoTarArchive, 1);
        this.tagManifestQueue = async.queue(writeIntoTarArchive, 1);

        // preValidationResult: we validate the job before running it
        // and store the result here. This is a ValidationResult object.
        // Check .isValid() to see if it's valid.
        // Check the .errors hash for info about what went wrong.
        this.preValidationResult = null;

        // Private
        this._tarPacker = null;
        this._tarOutputWriter = null;
        this._outputDirInitialized = false;
    }

    initOutputDir() {
        if (!this._outputDirInitialized) {
            if (path.extname(this.bagPath) == '' && !fs.existsSync(this.bagPath)) {
                fs.mkdirSync(this.bagPath, 0o755);
            } else if (!fs.existsSync(path.dirname(this.bagPath))) {
                fs.mkdirSync(path.dirname(this.bagPath), 0o755);
            }
            this._outputDirInitialized = true;
        }
    }

    getTarPacker() {
        if (this._tarPacker == null) {
            this._tarPacker = tar.pack();
            this._tarPacker.pipe(this.getTarOutputWriter());
        }
        return this._tarPacker;
    }

    getTarOutputWriter() {
        if (this._tarOutputWriter == null) {
            if (!this.bagPath.endsWith(".tar")) {
                var msg = `bagPath '${this.bagPath}' must have .tar extension`;
                this.errors.push(msg);
                throw msg;
            }
            var options = {
                mode: 0o644,
                autoClose: false
            };
            this._tarOutputWriter = fs.createWriteStream(this.bagPath, options);
        }
        return this._tarOutputWriter;
    }

    // TODO: Separate tar writer and dir writer into separate providers
    // that implement the same interface.
    create() {
        var bagger = this;
        this.preValidationResult = this.job.validate();
        if (!this.preValidationResult.isValid()) {
            this.errors.push("See job validation errors");
            return false;
        }
        this.initOutputDir();
        for (var f of this.job.filesToPackage()) {
            console.log(f)
            this.copyFile(f, 'data' + f.absPath);
        }
        if (this.writeAs == WRITE_AS_TAR) {
            this.payloadQueue.drain = function () {
                console.log("Done adding payload files");
                bagger.tarTagFiles();
            }
        }
    }

    tarTagFiles() {
        console.log("Writing tag files");
        var bagger = this;
        var oxumTag = bagger.job.bagItProfile.findTagByName('Payload-Oxum');
        // Payload-Oxum and Bag-Size:
        // See https://tools.ietf.org/html/draft-kunze-bagit-14#section-2.1.3
        if (oxumTag) {
            oxumTag.userValue = bagger.payloadOxum();
        }
        var sizeTag = bagger.job.bagItProfile.findTagByName('Bag-Size');
        if (sizeTag) {
            sizeTag.userValue = Util.toHumanSize(bagger.payloadByteCount());
        }
        for (var tagFileName of this.job.bagItProfile.requiredTagFileNames()) {
            var content = this.job.bagItProfile.getTagFileContents(tagFileName);
            var tmpFile = tmp.fileSync({ mode: 0o644, postfix: '.txt' });
            this.tmpFiles.push(tmpFile.name);
            console.log(tmpFile.name);
            var bytes = fs.writeSync(tmpFile.fd, content,  0, 'utf8');
            if (bytes != content.length) {
                throw `In tag file ${tagFileName} wrote only ${bytes} of ${content.length} bytes`;
            }
            fs.closeSync(tmpFile.fd);
            var source = {
                absPath: tmpFile.name,
                stats: fs.statSync(tmpFile.name)
            }
            this.copyFile(source, tagFileName);
        }
        // On done, create manifests
        this.tagFileQueue.drain = function () {
            console.log("Done adding tag files");
            bagger.tarManifests();
        }
    }

    tarManifests() {
        console.log("Writing manifests");
        var bagger = this;
        var algorithms = Object.keys(this.files[0].checksums);
        for (var alg of algorithms) {
            // Manifest name: manifest-md5.txt, manifest-sha256.txt, etc.
            var manifestName = `manifest-${alg}.txt`;
            var tmpFile = tmp.fileSync({ mode: 0o644, postfix: '.txt' });
            this.tmpFiles.push(tmpFile.name);
            console.log(tmpFile.name);
            for (var f of this.files) {
                if (f.fileType != constants.PAYLOAD_FILE) {
                    continue;
                }
                // Manifest entry: digest <space> path_of_file_in_bag
                var entry = `${f.checksums[alg]} ${f.relDestPath}${os.EOL}`;
                var bytes = fs.writeSync(tmpFile.fd, entry);
                if (bytes != entry.length) {
                    throw `In manifest ${manifestName} wrote only ${bytes} of ${entry.length} bytes`;
                }
            }
            fs.closeSync(tmpFile.fd);
            var source = {
                absPath: tmpFile.name,
                stats: fs.statSync(tmpFile.name)
            }
            this.copyFile(source, manifestName);
        }
        // On done, create tag manifests
        this.manifestQueue.drain = function () {
            console.log("Done writing payload manifests");
            bagger.tarTagManifests();
        }
    }

    tarTagManifests() {
        console.log("Tarring tag manifests");
        var bagger = this;
        var algorithms = Object.keys(this.files[0].checksums);
        for (var alg of algorithms) {
            // Manifest name: manifest-md5.txt, manifest-sha256.txt, etc.
            var manifestName = `tagmanifest-${alg}.txt`;
            var tmpFile = tmp.fileSync({ mode: 0o644, postfix: '.txt' });
            this.tmpFiles.push(tmpFile.name);
            console.log(tmpFile.name);
            for (var f of this.files) {
                if (f.fileType != constants.TAG_FILE && f.fileType != constants.PAYLOAD_MANIFEST) {
                    continue;
                }
                // Manifest entry: digest <space> path_of_file_in_bag
                var entry = `${f.checksums[alg]} ${f.relDestPath}${os.EOL}`;
                var bytes = fs.writeSync(tmpFile.fd, entry);
                if (bytes != entry.length) {
                    throw `In manifest ${manifestName} wrote only ${bytes} of ${entry.length} bytes`;
                }
            }
            fs.closeSync(tmpFile.fd);
            var source = {
                absPath: tmpFile.name,
                stats: fs.statSync(tmpFile.name)
            }
            this.copyFile(source, manifestName);
        }
        // On done, create tag manifests
        this.tagManifestQueue.drain = function () {
            console.log("Done writing tag manifests");
            bagger.cleanup();
        }
    }

    cleanup() {
        // On done, close the tar archive. Clean up all temp files.
        this.getTarPacker().finalize();

        // TODO: This MUST be called, even if we exit early with an error.
        for(var tmpFile of this.tmpFiles) {
            if (fs.existsSync(tmpFile)) {
                console.log("Deleting " + tmpFile);
                fs.unlinkSync(tmpFile);
            }
        }
    }

    // copyFile copies file at f.absSourcePath into relDestPath of the bag.
    // Param f is a hash with keys absSourcePath (absolute path to file)
    // and stats (Node fs.Stats object).
    copyFile(f, relDestPath) {
        // Copy file from src to dest
        // stat file and save srcPath, destPath, size, and checksums
        // as a BagItFile and push that into the files array.
        // Preserve owner, group, permissions and timestamps on copy.
        var bagItFile = new BagItFile(f.absPath, relDestPath, f.stats);
        this.files.push(bagItFile);
        console.log(`Copying ${bagItFile.absSourcePath} to ${bagItFile.relDestPath}`);
        if (this.writeAs == WRITE_AS_DIR) {
            this._copyIntoDir(bagItFile);
        } else if (this.writeAs == WRITE_AS_TAR) {
            this._copyIntoTar(bagItFile);
        } else {
            throw `Unknown writeAs value: '${this.writeAs}'`
        }
    }

    // Copies a file into a directory (unserialized bag)
    _copyIntoDir(bagItFile) {
        var absDestPath = path.join(this.bagPath, bagItFile.relDestPath);
        var writer = fs.createWriteStream(absDestPath);
        var reader = fs.createReadStream(bagItFile.absSourcePath);
        var hashes = this._getCryptoHashes(f);
        console.log(`Setting up pipes for ${hashes.length} digests + file`);
        for (var h of hashes) {
            reader.pipe(h)
        }
        reader.pipe(writer);
    }

    // Copies a file into a tarred bag.
    // These calls need to be synchronized, because the tar library
    // can write only one entry at a time.
    _copyIntoTar(bagItFile) {
        var bagger = this;
        var header = {
            name: bagger.job.bagName + '/' + bagItFile.relDestPath,
            size: bagItFile.stats.size,
            mode: bagItFile.stats.mode,
            uid: bagItFile.stats.uid,
            gid: bagItFile.stats.gid,
            mtime: bagItFile.stats.mtimeMs
        };
        var reader = fs.createReadStream(bagItFile.absSourcePath);
        var data = {
            reader: reader,
            header: header,
            tar: this.getTarPacker(),
            hashes: this._getCryptoHashes(bagItFile)
        };
        // Write files one at a time.
        if (bagItFile.fileType == constants.PAYLOAD_FILE) {
            this.payloadQueue.push(data);
        } else if (bagItFile.fileType == constants.TAG_FILE) {
            this.tagFileQueue.push(data);
        } else if (bagItFile.fileType == constants.TAG_MANIFEST) {
            this.tagManifestQueue.push(data);
        } else {
            this.manifestQueue.push(data);
        }
    }

    _getCryptoHashes(bagItFile) {
        var hashes = [];
        var profile = this.job.bagItProfile;
        for (var algorithm of profile.manifestsRequired) {
            console.log(`Adding ${algorithm} for ${bagItFile.relDestPath}`);
            var hash = crypto.createHash(algorithm);
            hash.setEncoding('hex');
            hash.on('finish', function() {
                hash.end();
                bagItFile.checksums[algorithm] = hash.read();
            });
            hashes.push(hash);
        }
        return hashes;
    }

    payloadFileCount() {
        return this.files.filter(f => f.fileType == constants.PAYLOAD_FILE).length;
    }

    payloadByteCount() {
        var byteCount = 0;
        for (var f of this.files) {
            if (f.fileType == constants.PAYLOAD_FILE) {
                byteCount += f.stats.size;
            }
        }
        return byteCount;
    }

    payloadOxum() {
        return `${this.payloadByteCount()}.${this.payloadFileCount()}`
    }

}

module.exports.Bagger = Bagger;
module.exports.WRITE_AS_DIR = WRITE_AS_DIR;
module.exports.WRITE_AS_TAR = WRITE_AS_TAR;
