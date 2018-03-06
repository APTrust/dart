const async = require('async');
const { BagItFile } = require('./bagit_file');
const constants = require('./constants');
const crypto = require('crypto');
const fs = require('fs');
const { ManifestParser } = require('./manifest_parser');
const os = require('os');
const path = require('path');
const stream = require('stream');
const { TagFileParser } = require('./tag_file_parser');
const tar = require('tar-stream');
const { Util } = require('../core/util');

class Validator {

    // pathToBag is the absolute path the the bag (dir or tar file)
    // profile is the BagItProfile that describes what consititutes
    // a valid bag.
    constructor(pathToBag, profile) {
        this.pathToBag = pathToBag;
        this.profile = profile;
        this.bagName = path.basename(pathToBag, '.tar');

        // files is a hash of BagItFiles, where the file's path
        // within the bag (relPath) is the key, and the BagItFile
        // object is the value. The hash makes it easy to get files
        // by relative path within the archive (e.g. data/photos/img.jpg).
        this.files = {};

        // These arrays contains the same BagItFile objects as the
        // files hash above, but these are organized by type.
        this.payloadFiles = [];
        this.payloadManifests = [];
        this.tagManifests = [];
        this.tagFiles = [];

        // Some profiles prohibit top-level directories other
        // than /data, and some prohibit top-level files that
        // are not required manifests or required tag files.
        this.topLevelDirs = [];
        this.topLevelFiles = [];

        this.errors = [];
    }

    // Param callback has signature fuction(errors), where errors
    // will be an array of strings, each of which describes a validation
    // error message. If your callback gets an empty array, the bag
    // was valida and there where no errors.
    validate(callback) {
        // Make sure untarred name matches tarred name
        // Gather checksums on all files
        // Validate checksums
        // Validate no extra or missing files
        // Ensure required tag files
        // Ensure required tags with legal values
        if (this.pathToBag.endsWith('.tar')) {
            this._readFromTar(callback);
        } else {
            this._readFromDir(callback);
        }
    }

    // callback is the function to call when validation is complete.
    _readFromTar(callback) {
        var validator = this;
        var extract = tar.extract();
        var bagNamePrefix = this.bagName + '/';
        var addedBagFolderNameError = false;
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
            if (!addedBagFolderNameError && !header.name.startsWith(bagNamePrefix)) {
                addedBagFolderNameError = true;
                var actualFolder = header.name.split('/')[0];
                this.errors.push(`Bag must untar to a folder called '${this.bagName}', not '${actualName}'`);
            }

            // If bag untars to the wrong directory, it's not valid, and there's
            // no use parsing the rest of it. This might save us running checksums
            // on many GB of data.
            if (!addedBagFolderNameError) {
                var absSourcePath = header.name;
                var relDestPath = header.name.replace(bagNamePrefix, '');
                var bagItFile = new BagItFile(absSourcePath, relDestPath, stats);
                validator.readFile(bagItFile, stream);
            }

            stream.on('end', function() {
                next() // ready for next entry
            })
        })

        extract.on('finish', function() {
            // all entries read
            validator.validateManifests(validator.payloadManifests);
            validator.validateManifests(validator.tagManifests);
            validator.validateNoExtraneousPayloadFiles();

            // Call the validationComplete callback.
            if (typeof callback == 'function') {
                callback(validator.errors);
            }
        })

        //pack.pipe(extract)
        extract.end(fs.readFileSync(this.pathToBag));
    }

    readFile(bagItFile, stream) {
        this._addFile(bagItFile);
        var pipes = this._getCryptoHashes(bagItFile)
        if (bagItFile.fileType == constants.PAYLOAD_FILE) {
            // No need for additional piping, just need crypto hashes.
        } else if (bagItFile.fileType == constants.PAYLOAD_MANIFEST) {
            var manifestParser = new ManifestParser(bagItFile);
            pipes.push(manifestParser.stream);
        } else if (bagItFile.fileType == constants.TAG_MANIFEST) {
            var manifestParser = new ManifestParser(bagItFile);
            pipes.push(manifestParser.stream);
        } else if (bagItFile.fileType == constants.TAG_FILE) {
            var tagFileParser = new TagFileParser(bagItFile);
            pipes.push(tagFileParser.stream);
        } else {
            pipes = null;
            throw `Unkonwn file type: ${bagItFile.fileType}`
        }
        for (var p of pipes) {
            stream.pipe(p);
        }
    }

    _addFile(bagItFile) {
        this.files[bagItFile.relDestPath] = bagItFile;
        switch (bagItFile.fileType) {
            case constants.PAYLOAD_FILE:
              this.payloadFiles.push(bagItFile);
              break;
            case constants.PAYLOAD_MANIFEST:
              this.payloadManifests.push(bagItFile);
              break;
            case constants.TAG_MANIFEST:
              this.tagManifests.push(bagItFile);
              break;
            default:
              this.tagFiles.push(bagItFile);
        }
        // Keep a list of top-level directory and file names.
        // tar files use forward slash, even on Windows
        // parts[0] should match bag name.
        var parts = bagItFile.relDestPath.split('/');
        var name = parts[0];
        if (parts.length > 1) {
            if (!Util.listContains(this.topLevelDirs, name)) {
                this.topLevelDirs.push(name);
            }
        } else {
            if (!Util.listContains(this.topLevelFiles, name)) {
                this.topLevelFiles.push(name);
            }
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

    validateManifests(manifests) {
        for(var manifest of manifests) {
            var basename = path.basename(manifest.relDestPath, '.txt');
            var algorithm = basename.split('-')[1];
            for (var filename of manifest.keyValueCollection.keys()) {
                //console.log("Manifest entry " + filename)
                var bagItFile = this.files[filename];
                if (!bagItFile) {
                    this.errors.push(`File ${filename} in ${manifest.relDestPath} is missing from payload.`);
                    continue;
                }
                var checksumInManifest = manifest.keyValueCollection.first(filename);
                var calculatedChecksum = bagItFile.checksums[algorithm];
                if (checksumInManifest != calculatedChecksum) {
                    this.errors.push(`Checksum for '${filename}': expected ${checksumInManifest}, got ${calculatedChecksum}`);
                }
            }
        }
    }

    validateNoExtraneousPayloadFiles() {
        for(var manifest of this.payloadManifests) {
            for (var f of this.payloadFiles) {
                //console.log("Payload file " + f.relDestPath)
                if (!manifest.keyValueCollection.first(f.relDestPath)) {
                    this.errors.push(`Payload file ${f.relDestPath} not found in ${manifest.relDestPath}`);
                }
            }
        }
    }

    // callback is the function to call when validation is complete.
    _readFromDir(callback) {
        throw "Reading bag from a directory is not yet implemented. It's tar only for now."
    }
}

module.exports.Validator = Validator;
