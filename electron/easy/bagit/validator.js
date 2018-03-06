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
}
