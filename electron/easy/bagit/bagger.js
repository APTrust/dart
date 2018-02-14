const BagItFile = require('./bagit_file');
const async = require('async');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const stream = require('stream');
const tar = require('tar-stream');


const WRITE_AS_DIR = 'dir';
const WRITE_AS_TAR = 'tar';

function writeIntoTarArchive(data, done) {
    console.log(data);
    var writer = data.tar.entry(data.header, done);
    for (var h of data.hashes) {
        data.reader.pipe(h)
    }
    data.reader.pipe(writer);
}

class Bagger {

    constructor(bagPath, profile, writeAs = WRITE_AS_TAR) {
        this.bagPath = bagPath;
        this.profile = profile;
        this.writeAs = writeAs;
        this.files = [];
        this.errors = [];

        // Curses!
        this.asyncQueue = async.queue(writeIntoTarArchive, 1);

        // Private
        this._tarPacker = null;
        this._tarOutputWriter = null;
        this._outputDirInitialized = false;
    }

    preValidate() {
        // Validate profile.
        // Ensure required tags are present.
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

    create() {
        // validate BagItProfile
        // ensure required tags are present
        this.initOutputDir();
        // copy all files
        // write tag files
        // write manifests
        // write tag manifests
        // validate bag
        // copy tag data to database
        // copy manifest data to database

        if (this.writeAs == WRITE_AS_TAR) {
            this.closeTarFile();
        }
    }

    // TODO: This needs to wait for writes to complete.
    closeTarFile() {
        this.getTarPacker().finalize();
    }

    copyFile(absSourcePath, relDestPath) {
        // Copy file from src to dest
        // stat file and save srcPath, destPath, size, and checksums
        // as a BagItFile and push that into the files array.
        // Preserve owner, group, permissions and timestamps on copy.
        if (!fs.existsSync(absSourcePath)) {
            var msg = `File does not exist: ${absSourcePath}`;
            this.errors.push(msg);
            throw err;
        }
        var stats = fs.statSync(absSourcePath);
        var bagItFile = new BagItFile(absSourcePath, relDestPath, stats.size);
        this.files.push(bagItFile);
        console.log(`Copying ${absSourcePath} to ${relDestPath}`);
        if (this.writeAs == WRITE_AS_DIR) {
            this._copyIntoDir(bagItFile, stats);
        } else if (this.writeAs == WRITE_AS_TAR) {
            this._copyIntoTar(bagItFile, stats);
        } else {
            throw `Unknown writeAs value: '${this.writeAs}'`
        }
    }

    // Copies a file into a directory (unserialized bag)
    _copyIntoDir(bagItFile, stats) {
        var absDestPath = path.join(this.bagPath, bagItFile.relDestPath);
        var writer = fs.createWriteStream(absDestPath);
        var reader = fs.createReadStream(bagItFile.absSourcePath);
        this._writePipeline(reader, writer, bagItFile);
    }

    // Copies a file into a tarred bag.
    // These calls need to be synchronized, because the tar library
    // can write only one entry at a time.
    _copyIntoTar(bagItFile, stats) {
        var bagger = this;
        //var tar = this.getTarPacker();
        var header = {
            name: bagItFile.relDestPath,
            size: stats.size,
            mode: stats.mode,
            uid: stats.uid,
            gid: stats.gid,
            mtime: stats.mtimeMs
        };
        var reader = fs.createReadStream(bagItFile.absSourcePath);
        // If we add a callback when we call tar.entry, we always
        // get a corrupt tar file. Why? And why does documentation
        // throughout the entire JavaScript/Node ecosystem suck so
        // bad? Most of it's useless, when it's not flat-out wrong.
        //var writer = tar.entry(header);
        //this._writePipeline(reader, writer, bagItFile);
        var data = {
            reader: reader,
            header: header,
            tar: this.getTarPacker(),
            hashes: this._getCryptoHashes(bagItFile)
        };
        this.asyncQueue.push(data);
    }

    // Pipes the contents of a file through all of the digest
    // algorithms into the destination file or tar file,
    // and stores the digests in BagItFile.checksums.
    _writePipeline(reader, writer, bagItFile) {
        // Writes to tar file must be synchronous and one at a time.
        // Add reader.on('end') event to pull next file from queue.
        // ---------------------------------------------------------

        // First, pipe the data from the reader through all
        // of the digest algorithms (md5, sha256, etc.).
        // Problem is that the reader starts sending data
        // as soon as the first pipe is attached. Do we need
        // to detach and then reattach the reader's pipe event?
        var hashes = this._getCryptoHashes(bagItFile);
        console.log(`Setting up pipes for ${hashes.length} digests + file`);
        for (var h of hashes) {
            reader.pipe(h)
        }
        reader.pipe(writer);
    }

    _getCryptoHashes(bagItFile) {
        var hashes = [];
        for (var algorithm of this.profile.manifestsRequired) {
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
        return this.files.length;
    }

    payloadByteCount() {
        var byteCount = 0;
        for (var f of this.files) {
            byteCount += f.size;
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
