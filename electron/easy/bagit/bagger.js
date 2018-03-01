const BagItFile = require('./bagit_file');
const async = require('async');
const constants = require('./constants');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const stream = require('stream');
const tar = require('tar-stream');
const tmp = require('tmp');

const WRITE_AS_DIR = 'dir';
const WRITE_AS_TAR = 'tar';

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
            this.copyFile(f, 'data' + f.absPath);
        }
        if (this.writeAs == WRITE_AS_TAR) {
            this.payloadQueue.drain = function () {
                console.log("Done adding payload files");
                bagger.tarTagFiles();
            }
        }
        // write tag manifests
        //    - use copyFile, so we get checksums
        //    - loop through this.files & write out checksums
        //      for anything that's a tag file
        //    - call BagItFile.getManifestEntry(algorithm) to get the
        //      manifest entry
        // validate bag
        // copy tag data to database
        // copy manifest data to database

        // TODO: Call this when all writing is done.
        if (this.writeAs == WRITE_AS_TAR) {
        //     this.getTarPacker().finalize();
        }
    }

    tarTagFiles() {
        // write tag files
        //    - use job.bagItProfile.requiredTagFileNames()
        //      to get list of tag files
        //    - use job.bagItProfile.getTagFileContents('tag-file-name.txt')
        //      to get the contents to write
        //    - use copyFile, so we get checksums
        //    - what about non-parsable custom tag files
        //      and tag files in special directories?
        console.log("Writing tag files");
        var bagger = this;
        var oxumTag = bagger.job.bagItProfile.findTagByName('Payload-Oxum');
        if (oxumTag) {
            oxumTag.userValue = bagger.payloadOxum();
        }
        for (var tagFileName of this.job.bagItProfile.requiredTagFileNames()) {
            var content = this.job.bagItProfile.getTagFileContents(tagFileName);
            var tmpFile = tmp.fileSync({ mode: 0o644, postfix: '.txt' });
            var bytes = fs.writeSync(tmpFile.fd, content,  0, 'utf8');
            if (bytes != content.length) {
                throw `In tag file ${tagFileName} wrote only ${bytes} of ${content.length} bytes`;
            }
            fs.closeSync(tmpFile.fd);
            this.tmpFiles.push(tmpFile.name);
            console.log(tmpFile.name);
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
        // write manifests
        //    - use copyFile, so we get checksums
        //    - loop through this.files & write out checksums
        //      for anything that's a payload file
        //    - call BagItFile.getManifestEntry(algorithm) to get the
        //      manifest entry

        console.log("Writing manifests");

        // On done, close the tar archive. Clean up all temp files.
        // TODO: Move this to the end of all manifest writing.
        this.getTarPacker().finalize();
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
            name: bagItFile.relDestPath,
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

    writeManifest(algorithm) {
        // Write payload manifest with data from files.
    }

    writeTagFile(relDestPath) {
        // Write tag file with data from profile.
        // Tag file data has to go through the hashing algorithms,
        // so we can put the checksums in the tag manifests.
    }
}

module.exports.Bagger = Bagger;
module.exports.WRITE_AS_DIR = WRITE_AS_DIR;
module.exports.WRITE_AS_TAR = WRITE_AS_TAR;
