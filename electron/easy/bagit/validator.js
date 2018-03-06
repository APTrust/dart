const async = require('async');
const { BagItFile } = require('./bagit_file');
const constants = require('./constants');
const crypto = require('crypto');
const fs = require('fs');
const { ManifestParser } = require('./manifest_parser');
const os = require('os');
const path = require('path');
const stream = require('stream');
const tar = require('tar-stream');
const { Util } = require('../core/util');

class Validator {

    // pathToBag is the absolute path the the bag (dir or tar file)
    // profile is the BagItProfile that describes what consititutes
    // a valid bag.
    constructor(pathToBag, profile) {
        this.pathToBag = pathToBag;
        this.profile = profile;
        this.files = []; // BagItFile
        this.errors = [];
    }

    validate() {
        // Make sure untarred name matches tarred name
        // Gather checksums on all files
        // Validate checksums
        // Validate no extra or missing files
        // Ensure required tag files
        // Ensure required tags with legal values
    }

    readBag() {
        if (this.pathToBag.endsWith('.tar')) {
            this._readFromTar();
        } else {
            this._readFromDir();
        }
    }

    _readFromTar() {
        var validator = this;
        var extract = tar.extract()
        extract.on('entry', function(header, stream, next) {
            // header is the tar header
            // stream is the content body (might be an empty stream)
            // call next when you are done with this entry
            var stats = {
                size: header.size,
                mode: header.mode,
                uid: header.uid,
                gid: header.gid,
                mtimeMs: header.mtime
            }
            var bagItFile = new BagItFile(null, header.name, stats);
            validator.readFile(bagItFile, stream);

            stream.on('end', function() {
                next() // ready for next entry
            })

            //stream.resume() // just auto drain the stream
        })

        extract.on('finish', function() {
            // all entries read
        })

        pack.pipe(extract)
    }

    readFile(bagItFile, stream) {
        var pipes = this._getCryptoHashes(bagItFile)
        if (bagItFile.fileType == constants.PAYLOAD_FILE) {
            // just need crypto hashes
        } else if (bagItFile.fileType == constants.PAYLOAD_MANIFEST) {
            var manifestParser = new ManifestParser(bagItFile);
            pipes.push(manifestParser.readableStream);
        } else if (bagItFile.fileType == constants.TAG_MANIFEST) {
            var manifestParser = new ManifestParser(bagItFile);
            pipes.push(manifestParser.readableStream);
        } else if (bagItFile.fileType == constants.TAG_FILE) {
            pipes.push(this._getTagFileParser());
        } else {
            pipes = null;
            throw `Unkonwn file type: ${bagItFile.fileType}`
        }
        for (var p of pipes) {
            stream.pipe(p);
        }
    }

    _getCryptoHashes(bagItFile) {
        var hashes = [];
        for (var algorithm of this.profile.manifestsRequired) {
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

    _readFromDir() {
        throw "Reading bag from a directory is not yet implemented. It's tar only for now."
    }
}
