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
         * bagRoot is the name of the top-level folder to which a tarred
         * bag untars. The folder name should match the bag name.
         *
         * E.g. "bag123.tar" should untar to bagRoot "bag123"
         *
         * For non-tarred bags, this property will be null.
         *
         * @type {string}
         */
        this.bagRoot = null;
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
         * This is a list of manifest algorithms found during an initial
         * scan of the bag. While some BagItProfiles specify that a manifest
         * with algorithm X must be present, the profile does preclude other
         * manifests with different algorithms also being present. It's
         * common among APTrust bags, for example, to find both md5 and sha256
         * manifests. The validator does an initial scan of the bag to find
         * extra manifests so it knows which checksums to run on payload and
         * tag files.
         *
         * If an initial scan reveals manifest-md5.txt and manifest-sha256.txt,
         * the manifestAlgorithmsFoundInBag will contain ["md5", "sha256"].
         *
         * See also {@link _scanBag}.
         *
         * @type {Array<string>}
         */
        this.manifestAlgorithmsFoundInBag = [];
        /**
         * errors is a list of error messages describing problems encountered
         * while trying to validate the bag or specific violations of the
         * BagItProfile that render this bag invalid.
         *
         * @type {Array<string>}
         */
        this.errors = [];
        /**
         * When set to true, this flag tells the validator not to validate
         * the bag serialization format. You'll want to disable this in cases
         * where you're trying to validate an unserialized (i.e. not tarred
         * or zipped or otherwise packaged) bag from a directory against a
         * profile that says the bag must be tarreed, zipped, etc. Because
         * sometimes you build a bag and you want to validate it before you
         * zip it or after you untar it.
         *
         * @type {boolean}
         * @default false
         */
        this.disableSerializationCheck = false;
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
        if (!fs.existsSync(this.pathToBag)) {
            this.errors.push(`File does not exist at ${this.pathToBag}`);
            this.emit('end');
            return;
        }
        if (!this._validateProfile()) {
            this.emit('end')
            return;
        }
        if (!this._validateSerialization()) {
            this.emit('end')
            return;
        }
        // Scan the bag for manifests. When that completes, it will
        // call _readBag() to read the contents.
        this._scanBag();
    }

    /**
     * This method does an initial scan of the bag to see what manifests
     * are present. While some BagItProfiles specify that a manifest
     * with algorithm X must be present, the profile does preclude other
     * manifests with different algorithms also being present. It's
     * common among APTrust bags, for example, to find both md5 and sha256
     * manifests. The validator does an initial scan of the bag to find
     * extra manifests so it knows which checksums to run on payload and
     * tag files.
     *
     * If an initial scan reveals manifest-md5.txt and manifest-sha256.txt,
     * the manifestAlgorithmsFoundInBag will contain ["md5", "sha256"].
     *
     * The most common reason for finding multiple manifests in a bag
     * comes from institutions that internally require one checksumming
     * algorithm, and who have to produce bags whose spec requires a
     * different algorithm.
     *
     * The validator will later validate ALL checksums, even those found
     * in manifests that are not part of the {@link BagItProfile}.
     *
     */
    _scanBag() {
        var validator = this;
        var reader = null;
        if (this.readingFromTar()) {
            reader = new TarReader(this.pathToBag);
        } else {
            reader = new FileSystemReader(this.pathToBag);
        }
        reader.on('error', function(err) { validator.emit('error', err) });
        reader.on('entry', function (entry) {
            var relPath = validator._cleanEntryRelPath(entry.relPath);
            if (relPath.match(Constants.RE_MANIFEST) || relPath.match(Constants.RE_TAG_MANIFEST)) {
                var algorithm = relPath.split('-')[1].split('.')[0];
                if (!validator.manifestAlgorithmsFoundInBag.includes(algorithm)) {
                    validator.manifestAlgorithmsFoundInBag.push(algorithm);
                }
            }
        });
        reader.on('finish', function() { validator._readBag() });

        // List the contents of the bag.
        reader.list();
    }

    /**
     * This method reads the contents of the bag. The actual work is done
     * in the callbacks. When reading is complete, this calls
     * _validateFormatAndContents()
     *
     */
    _readBag() {
        // Attach listeners to our reader.
        var validator = this;
        var reader = null;
        if (this.readingFromTar()) {
            reader = new TarReader(this.pathToBag);
        } else {
            reader = new FileSystemReader(this.pathToBag);
        }
        reader.on('entry', function (entry) { validator._readEntry(entry) });
        reader.on('error', function(err) { validator.emit('error', err) });

        // Once reading is done, validate all the info we've gathered.
        reader.on('finish', function() {
            // Is this really what we want to emit here?
            validator.emit('task', new TaskDescription(validator.pathToBag, 'read'))
            validator._validateFormatAndContents();
        });

        // Read the contents of the bag.
        reader.read();
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
        // ------------------------------------------
        // TODO: Validate Payload-Oxum
        // ------------------------------------------
        var okToProceed = this._validateUntarDirectory();
        if (okToProceed) {
            // ------------------------------------------
            // TODO: Validate fetch.txt
            // ------------------------------------------
            this._validateTopLevelDirs();
            this._validateTopLevelFiles();
            this._validateRequiredManifests(Constants.PAYLOAD_MANIFEST);
            this._validateRequiredManifests(Constants.TAG_MANIFEST);
            this._validateManifestEntries(Constants.PAYLOAD_MANIFEST);
            this._validateManifestEntries(Constants.TAG_MANIFEST);
            this._validateNoExtraneousPayloadFiles();
            this._validateTags();
        }
        this.emit('end')
    }

    /**
     * _validateSerialization checks to see whether or not the bag is
     * in a format that adheres to the profile's serialization rules.
     *
     * For example, if the profile's serialization attribute is "required"
     * and acceptSerialization is "application/tar", then this bag MUST
     * be a tar file.
     *
     * You can disable this check by setting
     * Validator.disableSerializationCheck to true. You would want to do
     * that in cases where you've built a bag and want to validate it
     * before you tar or zip it.
     *
     * @returns {boolean} entry - True if profile is valid, false if not.
     *
     */
    _validateSerialization() {
        var validFormat = true;
        if (!this.disableSerializationCheck) {
            var checkSerializationFormat = true;
            var bagIsDirectory = fs.statSync(this.pathToBag).isDirectory();
            if (this.profile.serialization == 'required') {
                if (bagIsDirectory) {
                    this.errors.push("Profile says bag must be serialized, but it is a directory.");
                    validFormat = false;
                }
            } else if (this.profile.serialization == 'forbidden') {
                if (!bagIsDirectory) {
                    this.errors.push("Profile says bag must not be serialized, but bag is not a directory.");
                    validFormat = false;
                    checkSerializationFormat = false;
                }
            }
            if (!bagIsDirectory && checkSerializationFormat) {
                if (!this._validateSerializationFormat()) {
                    var ext = path.extname(this.pathToBag);
                    this.errors.push(`Bag has extension '${ext}', but profile says it must be serialized as of one of the following types: ${this.profile.acceptSerialization.join(', ')}.`);
                    validFormat = false;
                }
            }
        } else {
            Context.logger.info(`Validator: Skipping validation of serialization format because disableSerializationCheck is true.`);
        }
        return validFormat;
    }

    /**
     * _validateSerializationFormat checks to see if the bag is in an allowed
     * serialized format. This is called only if necessary.
     *
     * @returns {boolean} entry - True if format is valid, false if not.
     *
     */
    _validateSerializationFormat() {
        var matchesValidExtension = false;
        for (var mimetype of this.profile.acceptSerialization) {
            var extensionRegex = Constants.SERIALIZATION_FORMATS[mimetype];
            if (extensionRegex !== undefined && this.pathToBag.match(extensionRegex)) {
                matchesValidExtension = true;
            }
        }
        return matchesValidExtension;
    }

    /**
     * _validateProfile validates the BagItProfile that will be used to
     * validate the bag. If the profile itself is not valid, we can't proceed.
     *
     * Errors in the BagItProfile will be copied into the validator.errors
     * list.
     *
     * @returns {boolean} entry - True if profile is valid, false if not.
     *
     */
    _validateProfile() {
        if (this.profile == null) {
            this.errors.push("Cannot validate bag because BagItProfile is missing.");
            return false;
        }
        var result = this.profile.validate();
        if (!result.isValid()) {
            for (let err of Object.values(result.errors)) {
                this.errors.push(`BagItProfile: ${err}`);
            }
            return false;
        }
        return true;
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
        } else if (entry.fileStat.isDirectory()) {
            var relPath = this._cleanEntryRelPath(entry.relPath);
            if (this.bagRoot == null && relPath == '') {
                this.bagRoot = entry.relPath.replace(/\/$/, ''); // right relpath for untarring
            } else if (this.bagRoot == null && relPath == entry.relPath.replace(/\/$/, '')) {
                this.bagRoot = relPath; // wrong relpath for untarring
            } else {
                this.topLevelDirs.push(relPath);
            }
            entry.stream.pipe(new stream.PassThrough());
        } else {
            // Skip symlinks, block devices, etc.
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
        this.files[relPath] = bagItFile;
        var fileType = BagItFile.getFileType(relPath);
        Context.logger.info(`Validator added ${relPath} as ${fileType}`);
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
     * @param {ReadStream} readStream - A stream from which we can read
     * the file's contents.
     */
    _readFile(bagItFile, readStream) {
        var validator = this;
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
        //
        // First create the pipe chain...
        readStream.pause();
        for (var p of pipes) {
            readStream.pipe(p);
        }

        // Now push all the data through the chain.
        readStream.on('error', function(err) {
            validator.errors.push(`Read error in ${bagItFile.relDestPath}: ${err.toString()}`)
        });
        readStream.resume();

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
     * This method is considered private, and it internal operations are
     * subject to change without notice.
     *
     * @returns {Array<crypto.Hash>}
     *
     */
    _getCryptoHashes(bagItFile) {
        let validator = this;
        let hashes = [];
        // Put together all of the algorithms we'll need for checksums,
        // filtering out empty strings and duplicates.
        let m = this.profile.manifestsRequired;
        let t = this.profile.tagManifestsRequired;
        let f = this.manifestAlgorithmsFoundInBag;
        let algorithms = new Set(m.concat(t).concat(f).filter(alg => alg != ''));
        for (let algorithm of algorithms) {
            let thisAlg = algorithm;
            // DEBUG
            if (validator.pathToBag.endsWith('example.edu.sample_good')) {
                console.log("Created hash for " + bagItFile.relDestPath);
            }
            // DEBUG
            let hash = crypto.createHash(algorithm);
            hash.setEncoding('hex');
            hash.on('finish', function() {
                // DEBUG
                // WHEN READING FROM DIRECTORY, THIS IS **NOT** BEING
                // FIRED FOR THE LAST 1-2 FILES IN THE DIR.
                if (validator.pathToBag.endsWith('example.edu.sample_good')) {
                    console.log("Finished hash for " + bagItFile.relDestPath);
                }
                // DEBUG
                hash.end();
                bagItFile.checksums[thisAlg] = hash.read();
            });
            hashes.push(hash);
        }
        return hashes;
    }

    /**
     * _validateUntarDirectory is for tarred bags only. It checks to see
     * whether the tar file extracts to a directory whose name matches
     * the bag name, minus the ".tar" extension. If it doesn't untar there,
     * this method adds an error to the validation results.
     *
     * E.g. "myBag.tar" should untar to a directory called "myBag"
     *
     * This rule only apples for BagItProfiles where tarDirMustMatchName
     * is true.
     *
     * The official BagIt 1.0 spec at
     * https://tools.ietf.org/html/draft-kunze-bagit-17#section-2 says:
     *
     * `The base directory can have any name.`
     *
     * This method is considered private, and it internal operations are
     * subject to change without notice.
     *
     * @returns {boolean} - If true, it's ok to proceed with the rest
     * of the validation. If false, validation stops, because no files
     * will be in their expected places.
     *
     */
    _validateUntarDirectory() {
        var okToProceed = true;
        if (this.readingFromTar() && this.profile.tarDirMustMatchName) {
            var tarFileName = path.basename(this.pathToBag, '.tar');
            if (this.bagRoot != tarFileName) {
                this.errors.push(`Bag should untar to directory '${tarFileName}', not '${this.bagRoot}'`);
                okToProceed = false;
            }
        }
        return okToProceed;
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
        if (!this.profile.allowMiscDirectories) {
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
        var manifestList = this.profile.manifestsRequired;
        if (manifestType === Constants.TAG_MANIFEST) {
            manifestList = this.profile.tagManifestsRequired;
        }
        for (var alg of manifestList) {
            var name = `${manifestType}-${alg}.txt`
            if(this.files[name] === undefined) {
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
                if (bagItFile === undefined) {
                    this.errors.push(`File '${filename}' in ${manifest.relDestPath} is missing from bag.`);
                    continue;
                }
                var checksumInManifest = manifest.keyValueCollection.first(filename);
                var calculatedChecksum = bagItFile.checksums[algorithm];
                if (checksumInManifest != calculatedChecksum) {
                    this.errors.push(`Bad ${algorithm} digest for '${filename}': manifest says '${checksumInManifest}', file digest is '${calculatedChecksum}'.`);
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
            if (tagFile === undefined) {
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
                    if (value == '' && !tagDef.emptyOk) {
                        this.errors.push(`Value for tag '${tagDef.tagName}' in ${filename} is missing.`);
                        continue;
                    }
                    if (Array.isArray(tagDef.values) && tagDef.values.length > 0) {
                        if (!Util.listContains(tagDef.values, value)) {
                            this.errors.push(`Tag '${tagDef.tagName}' in ${filename} contains illegal value '${value}'. [Allowed: ${tagDef.values.join(', ')}]`);
                        }
                    }
                }
            }
        }
    }

}

module.exports.Validator = Validator;
