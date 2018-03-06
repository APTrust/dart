const async = require('async');
const { BagItFile } = require('./bagit_file');
const constants = require('./constants');
const crypto = require('crypto');
const fs = require('fs');
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
        var extract = tar.extract()
        extract.on('entry', function(header, stream, next) {
            // header is the tar header
            // stream is the content body (might be an empty stream)
            // call next when you are done with this entry
            var

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
        if (bagItFile.fileType == constants.PAYLOAD_FILE) {
            this._readPayloadFile(bagItFile, stream);
        } else if (bagItFile.fileType == constants.PAYLOAD_MANIFEST) {
            this._readPayloadManifest(bagItFile, stream);
        } else if (bagItFile.fileType == constants.TAG_MANIFEST) {
            this._readTagManifest(bagItFile, stream);
        } else if (bagItFile.fileType == constants.TAG_FILE) {
            this._readTagFile(bagItFile, stream);
        } else {
            throw `Unkonwn file type: ${bagItFile.fileType}`
        }
    }

    _readPayloadFile(bagItFile, stream) {
        // Stream it through and get the checksums
    }

    _readTagFile(bagItFile, stream) {
        // Stream it through checksummer and tag parser
    }

    _readPayloadManifest(bagItFile, stream) {
        // Stream it through checksummer and manifest parser
    }

    _readTagManifest(bagItFile, stream) {
        // Stream it through checksummer and manifest parser
    }

    _readFromDir() {
        throw "Reading bag from a directory is not yet implemented. It's tar only for now."
    }
}
