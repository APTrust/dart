const { BagItFile } = require('./bagit_file');
const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs');
const { ManifestParser } = require('./manifest_parser');
const os = require('os');
const path = require('path');
const stream = require('stream');
const { TagFileParser } = require('./tag_file_parser');
const { Util } = require('../core/util');

/**
 * Validator validates BagIt packages (tarred or in directory format)
 * according to a BagIt profile.
 *
 * See the validate() method for a list of events.
 *
 */
class Validator extends EventEmitter {

    /**
     * Constructs a new BagIt validator.
     *
     * @param {string} pathToBag is the absolute path the the bag,
     * whether it's a directory or a tar file.
     *
     * @param {BagItProfile} profile is the BagItProfile that describes
     * what consititutes a valid bag.
     *
     */
    constructor(pathToBag, profile) {
        super();
        /**
         * pathToBag is the path to the directory or tar file that
         * contains the bag you want to validate.
         *
         * @type {string}
         */
        this.pathToBag = pathToBag;
        /**
         * profile is the BagItProfile against which we will validate
         * the bag.
         *
         * @type {BagItProfile}
         */
        this.profile = profile;
        /**
         * bagName is the calculated name of the bag, which will be either
         * the name of the directory that contains the bag files, or the name
         * of the tar file, minus the .tar extension. You can override this
         * by setting it explicitly.
         *
         * @type {BagItProfile}
         */
        this.bagName = path.basename(pathToBag, '.tar');
        /**
         * files is a hash of BagItFiles, where the file's path
         * within the bag (relPath) is the key, and the BagItFile
         * object is the value. The hash makes it easy to get files
         * by relative path within the archive (e.g. data/photos/img.jpg).
         *
         * @type {object.<string, BagItFile>}
        */
        this.files = {};
        /**
         * payloadFiles is an array of BagItFile objects representing
         * all of the payload files in the bag. This is a subset of the
         * same BagItFile objects in the Validator.files property.
         *
         * @type {Array<BagItFile>}
         */
        this.payloadFiles = [];
        /**
         * payloadManifests is an array of BagItFile objects representing
         * all of the payload manifests in the bag. This is a subset of the
         * same BagItFile objects in the Validator.files property.
         *
         * @type {Array<BagItFile>}
         */
        this.payloadManifests = [];
        /**
         * tagManifests is an array of BagItFile objects representing
         * all of the tag manifests in the bag. This is a subset of the
         * same BagItFile objects in the Validator.files property.
         *
         * @type {Array<BagItFile>}
         */
        this.tagManifests = [];
        /**
         * tagFiles is an array of BagItFile objects representing
         * all of the tag files in the bag. This is a subset of the
         * same BagItFile objects in the Validator.files property.
         *
         * @type {Array<BagItFile>}
         */
        this.tagFiles = [];
        /**
         * topLevelDirs is a list of strings representing the relative
         * paths of all of the directories found at the top level of the
         * bag. The "data" directory should always be in this list, if a
         * bag is valid. The validator tracks these because some BagItProfiles
         * allow top-level directories other than "data" and some do not.
         *
         * @type {Array<string>}
         */
        this.topLevelDirs = [];
        /**
         * topLevelFiles is a list of strings representing the relative
         * paths of all of the files found at the top level of the
         * bag. The "bagit.txt" and "bag-info.txt" files along with at least
         * one paylowd manifest should always be in this list if a bag is valid.
         * The validator tracks these because  some BagItProfiles allow additional
         * top-level files (other than required tag files and manifests) and some
         * do not.
         *
         * @type {Array<string>}
         */
        this.topLevelFiles = [];
        /**
         * reader will be an object capable of reading the either the tarred
         * bag (a {@link TarIterator}) or an untarred bag
         * {@link FileSystemIterator}. Classes for reading various formats
         * must implement the same read() interface and emit the same events
         * as either {@link TarIterator} or {@link FileSystemIterator}, both
         * of which are in the packaging directory of the DART project.
         *
         * @type {object}
         */
        this.reader = null;
        /**
         * errors is a list of error messages describing problems encountered
         * while trying to validate the bag or specific violations of the
         * BagItProfile that render this bag invalid.
         *
         * @type {Array<string>}
         */
        this.errors = [];
    }

    /**
     * validate runs all validation operations on the bag specified in the
     * validator's pathToBag property. This includes:
     *
     * * making sure the untarred bag name matches the tarred bag name
     * * validation checksums for all payload files, and for tag files that have checksums
     * * ensuring there are no extra or missing payload files
     * * ensuring that required tag files and manifests are present and valid
     * * ensuring that required tags are present and, where applicable, have legal values
     *
     * This method emits events "start", "task", "end", and "error".
     */
    validate() {
        this.emitter.emit('validateStart', `Validating ${this.pathToBag}`);
        if (this.pathToBag.endsWith('.tar')) {
            this.reader = new TarIterator(this.pathToBag);
        } else {
            this.reader = new FileSystemIterator(this.pathToBag);
        }
        // TODO: Attach events for entry, finish, and error.
    }

    _readEntry(entry) {
        // 1. Construct a BagItFile for the entry.
        // 2. Pass the contents of the entry through the hash digests
        // 3. Parse the contents as a manifest, if it is one
        // 4. Parse the contents as a tag file, if it is one
        // 5. Add the BagItFile to Validator.files, and to payloadFiles,
        //    payloadManifests, tagFiles, or tagManifests, as appropriate.
        // Remember that the iterator won't advance unless we read the
        // file contents (or at least pass them through the hash functions).
    }
}

module.exports.Validator = Validator;
