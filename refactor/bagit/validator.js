const { BagItFile } = require('./bagit_file');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const crypto = require('crypto');
const EventEmitter = require('events');
const { FileSystemReader } = require('../packaging/file_system_reader');
const fs = require('fs');
const { ManifestParser } = require('./manifest_parser');
const os = require('os');
const path = require('path');
const stream = require('stream');
const { TagFileParser } = require('./tag_file_parser');
const { TarReader } = require('../packaging/tar_reader');
const { TaskDescription } = require('./task_description');
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

        // -----------------------------------------------------------------
        // TODO: Attach log listeners for this object's events,
        // so debug logger can print info about what's happening.
        // -----------------------------------------------------------------
    }

    /**
     * readingFromTar returns true if the bag being validated is in tar format.
     *
     * @returns {boolean}
     */
    readingFromTar() {
        return this.pathToBag.endsWith('.tar');
    }

    /**
     * Returns an array of BagItFile objects that represent payload files.
     *
     * @returns {Array<BagItFile>}
     */
    payloadFiles() {
        return Object.values(this.files).filter(f => f.isPayloadFile());
    }

    /**
     * Returns an array of BagItFile objects that represent payload manifests.
     *
     * @returns {Array<BagItFile>}
     */
    payloadManifests() {
        return Object.values(this.files).filter(f => f.isPayloadManifest());
    }

    /**
     * Returns an array of BagItFile objects that represent tag files.
     *
     * @returns {Array<BagItFile>}
     */
    tagFiles() {
        return Object.values(this.files).filter(f => f.isTagFile());
    }

    /**
     * Returns an array of BagItFile objects that represent tag manifests.
     *
     * @returns {Array<BagItFile>}
     */
    tagManifests() {
        return Object.values(this.files).filter(f => f.isTagManifest());
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
        this.emit('validateStart', `Validating ${this.pathToBag}`);
        if (this.readingFromTar()) {
            this.reader = new TarReader(this.pathToBag);
        } else {
            this.reader = new FileSystemReader(this.pathToBag);
        }
        // Attach listeners to our reader.
        var validator = this;
        this.reader.on('entry', function (entry) { validator._readEntry(entry) });
        this.reader.on('error', function(err) { validator.emit('error', err) });

        // Once reading is done, validate all the info we've gathered.
        this.reader.on('finish', function() {
            // Is this really what we want to emit here?
            validator.emit('task', new TaskDescription(validator.pathToBag, 'read'))
            validator._validateFormatAndContents();
        });

        // Read the contents of the bag.
        this.reader.read();
    }

    /**
     * _validateFormatAndContents is called internally by the public validate()
     * method. While validate() reads the contents of the bag, parses manifests
     * and tag files, this method compares the info in the bag to what the
     * {@link BagItProfile} says is valid.
     *
     * This method is considered private, and it internal operations are
     * subject to change without notice.
     *
     */
    _validateFormatAndContents() {
        this._validateTopLevelDirs();
        this._validateTopLevelFiles();
        this._validateRequiredManifests(Constants.PAYLOAD_MANIFEST);
        this._validateRequiredManifests(Constants.TAG_MANIFEST);
        this._validateManifestEntries(Constants.PAYLOAD_MANIFEST);
        this._validateManifestEntries(Constants.TAG_MANIFEST);
        this._validateNoExtraneousPayloadFiles();
        this._validateTags();
        this.emit('end')
    }

    /**
     * _readEntry reads a single entry from a TarReader or FileSystemReader.
     * An entry represents one file within the bag (any type of file: payload,
     * manifest, tag manifest, or tag file). This method add's the file's metadata
     * to the Validator.files hash, computes the file's checksums, and parses the
     * file's contents if necessary.
     *
     * @param {object} entry - An entry returned by a TarReader or FileSystemReader.
     *
     */
    _readEntry(entry) {
        if (entry.fileStat.isFile()) {
            var bagItFile = this._addBagItFile(entry);
            this._readFile(bagItFile, entry.stream);
        } else {
            // Skip directories, symlinks, etc.
            entry.stream.pipe(new stream.PassThrough());
            Context.logger.info(`Validator: ${entry.relPath} as is not a regular file`);
        }
    }

    /**
     * _addBagItFile adds a BagItFile to the Validator.files hash, based on
     * the entry it receives from the reader. At this point, the newly created
     * BagItFile will have its path and stats info, but no parsed data or
     * checksums.
     *
     * @param {object} entry - An entry returned by a TarReader or FileSystemReader.
     *
     * @param {string} entry.relPath - The relative path of the file inside the bag.
     *
     * @param {FileStat|fs.Stat} entry.fileStat - An object containing stats info
     * about the file.
     *
     * @returns {BagItFile} The BagItFile created from the entry object.
     *
     */
    _addBagItFile(entry) {
        this.emit('task', new TaskDescription(entry.relPath, 'add'));
        var relPath = this._cleanEntryRelPath(entry.relPath);
        var absPath = '';
        if (!this.readingFromTar()) {
            absPath = path.join(this.pathToBag, relPath);
        }
        var bagItFile = new BagItFile(absPath, relPath, entry.fileStat);
        this.files[entry.relPath] = bagItFile;
        var fileType = BagItFile.getFileType(relPath);
        Context.logger.info(`Validator added ${entry.relPath} as ${fileType}`);
        return bagItFile;
    }

    /**
     * _cleanEntryRelPath removes trailing slashes from relPath. When the
     * validator is reading from a tar file, this also removes the leading
     * bag name from the path. Since tarred bags must untar to a directory
     * whose name matches the bag, relative paths within tar files will
     * always be prefixed with the bag name. To get a true relative path,
     * we have to change "bagname/data/file.txt" to "data/file.txt".
     *
     * @param {string} relPath - The relative path, as we got it from the
     * TarReader or FileSystemReader.
     *
     * @returns {string} A clean version of the relative path.
     *
     */
    _cleanEntryRelPath(relPath) {
        var cleanPath = relPath;
        if (this.readingFromTar()) {
            var tarFileName = path.basename(this.pathToBag, '.tar');
            var re = new RegExp("^" + tarFileName + "/");
            cleanPath = relPath.replace(re, '');
        }
        return cleanPath.replace(/\/$/, '');
    }

    /**
     * _readFile pushes the file's bits through whatever checksum algorithms
     * the {@link BagItProfile} says we're supposed to validate. It also parses
     * the contents of the file, if it happens to be a manifest, tag manifest,
     * or text-based tag file.
     *
     * Note that the read() method of TarReader and FileSystemReader will not
     * advance until we've read the entire stream (or until it closes or errors out).
     *
     * @param {BagItFile} bagItFile - A file inside the directory or tarball.
     *
     * @param {ReadStream} stream - A stream from which we can read the file's
     * contents.
     */
    _readFile(bagItFile, stream) {
        this.emit('task', new TaskDescription(bagItFile.relDestPath, 'checksum'));

        // Get pipes for all of the hash digests we'll need to calculate.
        // We need to calculate checksums on everything in the bag.
        var pipes = this._getCryptoHashes(bagItFile)

        // For manifests, tag manifests, and tag files, we need to parse
        // file contents as well.
        if (bagItFile.isPayloadManifest() || bagItFile.isTagManifest()) {
            var manifestParser = new ManifestParser(bagItFile);
            pipes.push(manifestParser.stream);
        } else if (bagItFile.isTagFile() && bagItFile.relDestPath.endsWith(".txt")) {
            var tagFileParser = new TagFileParser(bagItFile);
            pipes.push(tagFileParser.stream);
        }

        // Now we can do a single read of the file, piping it through
        // streams for checksum calculations and parsing. This is much
        // more efficient than doing a seperate read for each, especially
        // in bags that use multiple digest algorithms.
        for (var p of pipes) {
            stream.pipe(p);
        }

        Context.logger.info(`Validator is running checksums for ${bagItFile.relDestPath}`);
    }

    /**
     * _getCryptoHashes returns a list of prepared cryptographic hashes that
     * are ready to have bits streamed through them. Each hash includes a
     * pre-wired 'finish' event that assigns the computed checksum to the
     * BagItFile's checksums hash. For example, a sha256 hash, once the bits
     * have been pushed through it, will set the following in it's finish event:
     *
     * @example
     * bagItFile.checksums['sha256'] = "[computed hex value]";
     *
     * @param {BagItFile} bagItFile - A file inside the directory or tarball.
     * This is the file whose checksums will be computed.
     *
     * @returns {Array<crypto.Hash>}
     *
     */
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


    /**
     * _validateTopLevelDirs checks to see if any directories other than
     * the required "data" directory exist at the top level of the bag
     * structure. Some {@link BagItProfile}s allow for this, others do not.
     * If an illegal top-level directory appears in the bag, this method
     * will make a note of it in the Validator.errors array.
     *
     * This method is considered private, and it internal operations are
     * subject to change without notice.
     *
     */
    _validateTopLevelDirs() {
        Context.logger.info(`Validator: Validating top-level directories in ${this.pathToBag}`);
        var exceptions = ['data']; // data dir is always required
        for (var f of this.profile.tagFileNames()) {
            var requiredTagDir = f.split('/', 1);
            exceptions.push(requiredTagDir);
        }
        if (!this.profile.allowMiscTopLevelDirectories) {
            for (var dir of this.topLevelDirs) {
                if (!Util.listContains(exceptions, dir)) {
                    this.errors.push(`Profile prohibits top-level directory ${dir}`);
                }
            }
        }
    }

    /**
     * _validateTopLevelFiles looks for illegal files in the top-level directory
     * of the bag. Most bags require certain top-level tag files (bagit.txt,
     * bag-info.txt, etc.) and manifests (manifest-sha256.txt,
     * tagmanifest-sha256.txt, etc), but some {@link BagItProfile}s allow
     * miscellaneous files to exist in that space and others do not.
     *
     * If this method finds illegal top-level files, it will make a note of each
     * one in the Validator.errors array.
     *
     * This method is considered private, and it internal operations are
     * subject to change without notice.
     *
     */
    _validateTopLevelFiles() {
        Context.logger.info(`Validator: Validating top-level files in ${this.pathToBag}`);
        if (!this.profile.allowMiscTopLevelFiles) {
            var exceptions = this.profile.tagFileNames();
            for (var alg of this.profile.manifestsRequired) {
                exceptions.push(`manifest-${alg}.txt`);
            }
            for (var alg of this.profile.tagManifestsRequired) {
                exceptions.push(`tagmanifest-${alg}.txt`);
            }
            for (var name of this.topLevelFiles) {
                if (name == 'fetch.txt') {
                    // This one has its own rule
                    if (!this.profile.allowFetchTxt) {
                        this.errors.push(`Bag contains fetch.txt file, which profile prohibits.`);
                    }
                    continue;
                }
                if (!Util.listContains(exceptions, name)) {
                    this.errors.push(`Profile prohibits top-level file ${name}`);
                }
            }
        }
    }

    /**
     * _validateRequiredManifests checks to see if the manifests required by
     * the {@link BagItProfile} are actually present in the bag. If they're not,
     * it records the error in the Validator.errors array.
     *
     * This method is considered private, and it internal operations are
     * subject to change without notice.
     *
     * @param {string} manifestType - The type of manifest to look for.
     * This should be either {@link Constants.PAYLOAD_MANIFEST} or
     * {Constants.TAG_MANIFEST}.
     *
     */
    _validateRequiredManifests(manifestType) {
        Context.logger.info(`Validator: Validating ${manifestType}s`);
        for (var alg of this.profile.manifestsRequired) {
            var name = `${manifestType}-${alg}.txt`
            if(!this.files[name]) {
                this.errors.push(`Bag is missing required manifest ${name}`);
            }
        }
    }

    /**
     * _validateManifestEntries checks to see that the checksum entries in a
     * payload manifest or tag manifest match the actual computed digests of
     * the files in the bag. It records mismatches in the Validator.errors
     * array.
     *
     * This method is considered private, and it internal operations are
     * subject to change without notice.
     *
     * @param {string} manifestType - The type of manifest to look for.
     * This should be either {@link Constants.PAYLOAD_MANIFEST} or
     * {Constants.TAG_MANIFEST}.
     *
     */
    _validateManifestEntries(manifestType) {
        var manifests = this.payloadManifests();
        if (manifestType === Constants.TAG_MANIFEST) {
            manifests = this.tagManifests();
        }
        Context.logger.info(`Validator: Validating ${manifests.length} ${manifestType}s`);
        for(var manifest of Object.values(manifests)) {
            Context.logger.info(`Validator: Validating ${manifest.relDestPath}`);
            var basename = path.basename(manifest.relDestPath, '.txt');
            var algorithm = basename.split('-')[1];
            for (var filename of manifest.keyValueCollection.keys()) {
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

    /**
     * _validateNoExtraneousPayloadFiles checks for files in the data directory
     * that are not listed in the payload manifest(s). It records offending
     * files in the Validator.errors array.
     *
     * This method is considered private, and it internal operations are
     * subject to change without notice.
     *
     */
    _validateNoExtraneousPayloadFiles() {
        Context.logger.info(`Validator: Looking for extraneous payload files in ${this.pathToBag}`);
        for(var manifest of this.payloadManifests()) {
            for (var f of this.payloadFiles()) {
                //console.log("Payload file " + f.relDestPath)
                if (!manifest.keyValueCollection.first(f.relDestPath)) {
                    this.errors.push(`Payload file ${f.relDestPath} not found in ${manifest.relDestPath}`);
                }
            }
        }
    }

    /**
     * _validateTags ensures that all required tag files are present, that
     * all required tags are present, and that all tags have valid values
     * if valid values were defined in the {@link BagItProfile}. This method
     * records all the problems it finds in the Validator.errors array.
     *
     * This method is considered private, and it internal operations are
     * subject to change without notice.
     *
     */
    _validateTags() {
        Context.logger.info(`Validator: Validating tags in ${this.pathToBag}`);
        var requiredTags = this.profile.tagsGroupedByFile();
        for (var filename of Object.keys(requiredTags)) {
            Context.logger.info(`Validator: Validating tags in ${filename}`);
            var tagFile = this.files[filename];
            if (!tagFile) {
                this.errors.push(`Required tag file ${filename} is missing`);
                continue;
            }
            if (tagFile.keyValueCollection == null) {
                this.errors.push(`Tag file ${filename} has no data`);
                continue;
            }
            var tagsRequiredForThisFile = requiredTags[filename];
            for (var tagDef of tagsRequiredForThisFile) {
                var parsedTagValues = tagFile.keyValueCollection.all(tagDef.tagName);
                if (parsedTagValues == null) {
                    // Tag was not present at all.
                    if (tagDef.required) {
                        this.errors.push(`Required tag ${tagDef.tagName} is missing from ${filename}`);
                    }
                    continue;
                }
                for (var value of parsedTagValues) {
                    if (value == '' && tagDef.emptyOk) {
                        continue;
                    }
                    if (Array.isArray(tagDef.values) && tagDef.values.length > 0) {
                        if (!Util.listContains(tagDef.values, value)) {
                            this.errors.push(`Tag ${tagDef.tagName} in ${filename} contains illegal value ${value}. [Allowed: ${tagDef.values.join(', ')}]`);
                        }
                    }
                }
            }
        }
    }

}

module.exports.Validator = Validator;
