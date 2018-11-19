const { AppSetting } = require('../core/app_setting');
const { BagItProfileInfo } = require('./bagit_profile_info');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { PersistentObject } = require('../core/persistent_object');
const { TagDefinition } = require('./tag_definition');
const { Util } = require('../core/util');
const { ValidationResult } = require('../core/validation_result');

/**
 * BagItProfile describes what constitutes a valid bag.
 * These profiles are based on the BagIt profiles described
 * in https://github.com/bagit-profiles/bagit-profiles, with
 * some changes and additions.
 *
 * @see {@link https://github.com/bagit-profiles/bagit-profiles|Standard BagIt Profiles}
 * @see {@link BagItProfileInfo}
 * @see {@link TagDefinition}
 *
 * @param {string} name - The name this profile.
 * @default 'New BagIt Profile'
 * @param {string} description - A helpful description of the profile for people
 * who will be using it.
 * @default 'New custom BagIt profile'
 */
class BagItProfile extends PersistentObject {

    constructor(name, description) {
        super('BagItProfile');
        /**
          * Name is the name of this profile.
          * Names should be unique, to prevent confusion.
          *
          * @type {string}
          */
        this.name = name || 'New BagIt Profile';
        /**
          * The description of this profile should be meaningful to the user.
          *
          * @type {string}
          */
        this.description = description || 'New custom BagIt profile';
        /**
          * A list of BagIt versions that are valid for bags that
          * conform to this profile. For example, '0.97'.
          *
          * @type {string[]}
          * @default ['0.97']
          */
        this.acceptBagItVersion = ['0.97', '1.0'];
        /**
          * A list of BagIt sserialization formats that are valid
          * for bags that conform to this profile. These may include
          * 'tar', 'zip', 'rar', etc.
          *
          * @type {string[]}
          * @default ['tar']
          */
        this.acceptSerialization = ['tar'];
        /**
          * This describes whether bags conforming to this profile
          * may have a fetch.txt file.
          *
          * @type {boolean}
          * @default false
          */
        this.allowFetchTxt = false;
        /**
          * Describes whether bags conforming to this profile
          * may include files in the top-level folder other
          * than manifests, tag manifests, and the required tag
          * files listed in the {@link tags} list.
          *
          * @type {boolean}
          * @default false
          */
        this.allowMiscTopLevelFiles = false;
        /**
          * Describes whether bags conforming to this profile
          * may include directories other than the payload
          * directory (aka 'data' directory) in the top-level
          * folder. These other directories are sometimes used
          * to hold custom tag files.
          *
          * @type {boolean}
          * @default false
          */
        this.allowMiscDirectories = false;
        /**
          * This contains metadata about the BagIt profile
          * itself, such as who publishes and maintains it.
          *
          * @type {BagItProfileInfo}
          */
        this.bagItProfileInfo = new BagItProfileInfo();
        /**
          * A list of algorithms of required manifests.
          * For example, 'sha256' indicates that bags conforming
          * to this profile must have a manifest-sha256.txt file.
          *
          * @type {string[]}
          * @default ['sha256']
          */
        this.manifestsRequired = ['sha256'];
        /**
          * A list of algorithms of required tag manifests.
          * For example, 'sha256' indicates that bags conforming
          * to this profile must have a tagmanifest-sha256.txt file.
          * Leave this empty if no tag manifests are required.
          *
          * @type {string[]}
          * @default []
          */
        this.tagManifestsRequired = [];
        /**
          * A list of tags that you expect to be present or expect
          * to parse when creating or validating bags that conform to
          * this profile.
          *
          * Note that this property was called requiredTags in prior
          * versions of DART, and in the BagItProfile JSON from those
          * versions.
          *
          * @type {TagDefinition[]}
          */
        this.tags = [];
        /**
          * Describes whether bags conforming to this profile may or
          * may not be serialized. Allowed values are 'required',
          * 'optional', and 'forbidden'.
          *
          * @type {string}
          * @default 'optional'
          */
        this.serialization = "optional";
        /**
          * baseProfileId allows us to track whether this profile
          * is based on a built-in. If so, we don't allow the user
          * to modify certain elements of the profile. This will
          * be blank for many profiles.
          *
          * @type {string}
          * @default null
          */
        this.baseProfileId = null;
        /**
          * Describes whether this profile is built into the application.
          * Builtin profiles cannot be deleted by users.
          *
          * @type {boolean}
          * @default false
          */
        this.isBuiltIn = false;
        /**
          * Describes whether a tarred bag MUST untar to a directory
          * whose name matches the tar file name.
          *
          * E.g. Must bag "photos123.tar" untar to a directory called
          * "photos123". The APTrust and DPN specs, as well as some
          * others, require this, though the official BagIt spec does
          * not.
          *
          * @type {boolean}
          * @default false
          */
        this.tarDirMustMatchName = false;

        this._addStandardBagItFile();
        this._addStandardBagInfoFile();
    }

    _addStandardBagItFile() {
        // BagIt spec says these two tags in bagit.txt file
        // are always required.
        var version = new TagDefinition('bagit.txt', 'BagIt-Version');
        version.required = true;
        version.emptyOk = false;
        version.values = Constants.BAGIT_VERSIONS;
        version.defaultValue = "0.97";
        version.help = "Which version of the BagIt specification describes this bag's format?";
        var encoding = new TagDefinition('bagit.txt', 'Tag-File-Character-Encoding');
        encoding.required = true;
        encoding.emptyOk = false;
        encoding.defaultValue = "UTF-8";
        encoding.help = "How are this bag's plain-text tag files encoded? (Hint: usually UTF-8)";
        this.tags.push(version);
        this.tags.push(encoding);
    }

    // This adds a standard bag-info.txt file to the BagIt profile.
    // We call this only when the user clicks to create a new blank profile.
    _addStandardBagInfoFile() {
        var tags = [
            'Bag-Count',
            'Bag-Group-Identifier',
            'Bag-Size',
            'Bagging-Date',
            'Contact-Email',
            'Contact-Name',
            'Contact-Phone',
            'External-Description',
            'External-Identifier',
            'Internal-Sender-Description',
            'Internal-Sender-Identifier',
            'Organization-Address',
            'Payload-Oxum',
            'Source-Organization']
        for(var tagName of tags) {
            if(this.getTagsFromFile('bag-info.txt', tagName).length == 0) {
                var t = new TagDefinition('bag-info.txt', tagName);
                t.required = false;
                t.emptyOk = true;
                this.tags.push(t);
            }
        }
    }


    /**
     * This returns a ValidationResult that describes what if anything
     * is not valid about this profile. Note that this method validates
     * the profile itself. It does not validate a bag.
     *
     * @returns {ValidationResult} - The result of the validation check.
     */
    validate() {
        var result = new ValidationResult();
        if (Util.isEmpty(this.id)) {
            result.errors["id"] = "Id cannot be empty.";
        }
        if (Util.isEmpty(this.name)) {
            result.errors["name"] = "Name cannot be empty.";
        }
        if (Util.isEmptyStringArray(this.acceptBagItVersion)) {
            result.errors["acceptBagItVersion"] = "Profile must accept at least one BagIt version.";
        }
        if (Util.isEmptyStringArray(this.manifestsRequired)) {
            result.errors["manifestsRequired"] = "Profile must require at least one manifest.";
        }
        if (!this.hasTagFile("bagit.txt")) {
            result.errors["tags"] = "Profile lacks requirements for bagit.txt tag file.";
        }
        if (!this.hasTagFile("bag-info.txt")) {
            result.errors["tags"] += "\nProfile lacks requirements for bag-info.txt tag file.";
        }
        if (!Util.listContains(Constants.REQUIREMENT_OPTIONS, this.serialization)) {
            result.errors["serialization"] = `Serialization must be one of: ${Constants.REQUIREMENT_OPTIONS.join(', ')}.`;
        }
        return result;
    }

    /**
     * findMatchingTags returns an array of TagDefinition objects
     * matching the specified criteria.
     *
     * @see also {@link findMatchingTag}
     *
     * @param {string} property - The name of the TagDefinition
     * property to match. For example, 'name' or 'defaultValue'.
     * @param {string} value - The value of the property to match.
     *
     * @returns {TagDefinition[]}
     */
    findMatchingTags(property, value) {
        return this.tags.filter(tag => tag[property] === value);
    }

    /**
     * findMatchingTag returns the first TagDefinition object that
     * matches the specified criteria.
     *
     * @see also {@link findMatchingTags}
     *
     * @param {string} property - The name of the TagDefinition
     * property to match. For example, 'name' or 'defaultValue'.
     * @param {string} value - The value of the property to match.
     *
     * @returns {TagDefinition}
     */
    firstMatchingTag(property, value) {
        return this.tags.find(tag => tag[property] === value);
    }

    /**
     * getTagsFromFile returns all tags with the specified tagname
     * from the specified file. This usually returns zero or one results,
     * but because the {@link https://tools.ietf.org/html/draft-kunze-bagit-14|BagIt spec}
     * says a tag can appear multiple times in a file, this may return a list.
     *
     * @see also {@link findMatchingTags}
     *
     * @param {string} filename - The name of the tagfile.
     * @param {string} tagname - The name of the tag.
     *
     * @returns {TagDefinition[]}
     */
    getTagsFromFile(filename, tagname) {
        return this.tags.filter(tag => tag.tagFile === filename && tag.tagName === tagname);
    }

    /**
     * This returns true if the tags list includes a tagfile
     * with the specified filename.
     *
     * @param {string} filename - The name of the tagfile.
     *
     * @returns {boolean}
     */
    hasTagFile(filename) {
        return typeof this.tags.find(tag => tag.tagFile === filename) != 'undefined';
    }

    /**
     * This returns a suggested unique bag name that is valid for
     * the current profile.
     *
     * @returns {string}
     */
    suggestBagName() {
        var suggestion = "";
        if (this.hasTagFile("aptrust-info.txt")) {
            var setting = AppSetting.firstMatching("name", "Institution Domain")
            suggestion = `${setting.value}.bag-${Date.now()}`
        } else if (this.hasTagFile("dpn-tags/dpn-info.txt")) {
            suggestion = Util.uuid4();
        } else {
            suggestion = BagItProfile.suggestGenericBagName();
        }
        return suggestion;
    }
    /**
     * This returns a generic unique bag name suggestion.
     *
     * @returns {string}
     */
    static suggestGenericBagName() {
        return `bag-${Date.now()}`;
    }
    /**
     * This returns true if the bag name contains no illegal
     * characters. Illegal characters include <, >, :, ", /, \, ?, *,
     * space, tab, carriage return and newline.
     *
     * @param {string} name - The bag name you want to validate.
     *
     * @returns {boolean}
     */
    static nameLooksLegal(name) {
        var illegal = /[<>:"\/\|\?\*\\\s\t\n\r]/g;
        return !Util.isEmpty(name) && name.match(illegal) == null;
    }
    /**
     * This returns true if the name is legal for this profile.
     *
     * @param {string} name - The bag name you want to validate.
     *
     * @returns {boolean}
     */
    isValidBagName(name) {
        if (Util.isEmpty(name)) {
            return false;
        }
        if (this.hasTagFile("aptrust-info.txt")) {
            var setting = AppSetting.firstMatching("name", "Institution Domain")
            var requiredPrefix = `${setting.value}.`;
            return (name.startsWith(requiredPrefix) &&
                    name.length > requiredPrefix.length &&
                    BagItProfile.nameLooksLegal(name));
        } else if (this.hasTagFile("dpn-tags/dpn-info.txt")) {
            return Util.looksLikeUUID(name);
        } else {
            return BagItProfile.nameLooksLegal(name)
        }
    }
    /**
      * Returns a hash of required tags, with filename
      * as the key. Value is a list of required tags,
      * in alpha order by name.
      *
      * @returns {Object<string, TagDefinition[]>}
      */
    tagsGroupedByFile() {
        var tagsByFile = {};
        for (var tag of this.tags) {
            if(tagsByFile[tag.tagFile] == null) {
                tagsByFile[tag.tagFile] = [];
            }
            tagsByFile[tag.tagFile].push(tag);
        }
        for (var f of Object.keys(tagsByFile)) {
            let sortFunction = Util.getSortFunction('tagName', 'asc');
            tagsByFile[f].sort(sortFunction);
        }
        return tagsByFile;
    }

    /**
      * getTagFileContents returns a string that you can
      * write to the tag file when creating a bag. Use requiredTagFileNames
      * to get all tag file names.
      *
      * @example
      * var contents = profile.getTagFileContentsByName(filename)
      * // returns
      * // Tag-Name: Value
      * // Other-Tag: Other value
      *
      * @param {string} name - The name of the tag file (relative path
      * within the bag)
      *
      * @returns {string}
      */
    getTagFileContents(tagFile) {
        var tags = this.tagsGroupedByFile(false)[tagFile];
        if (tags === undefined || !tags) {
            throw `No such tag file: ${tagFile}`;
        }
        var lines = [];
        for(var tagDef of tags) {
            lines.push(tagDef.toFormattedString());
        }
        return lines.join("\n");
    }
    /**
      * Returns true if filename is a custom file added for a
      * specific job (i.e. is not part of the core profile).
      * All tags in a custom tag file have isUserAddedTag = true.
      *
      * @param {string} filename - The name of the tag file to check.
      *
      * @returns {boolean}
      */
    isCustomTagFile(filename) {
        for (var tag of this.tags) {
            if (tag.tagFile == filename && tag.isUserAddedFile == true) {
                return true;
            }
        }
        return false;
    }
    /**
      * Returns the names of all tag files, in alpha order.
      *
      * @returns {string[]}
      */
    tagFileNames() {
        var fileNames = new Set();
        for (var tag of this.tags) {
            if (!fileNames.has(tag.tagFile)) {
                fileNames.add(tag.tagFile);
            }
        }
        return Array.from(fileNames).sort();
    }
    // ---------------------------------------------------------
    // TODO: Move to validator.
    // ---------------------------------------------------------
    /**
      * Returns true if the specified tag file has values for all
      * required tags.
      *
      * @param {string} tagFileName - The name of the tag file to check.
      *
      * @returns {boolean}
      */
    fileHasAllRequiredValues(tagFileName) {
        for (var tag of this.tags) {
            if(tag.tagFile == tagFileName) {
                if (tag.addedForJob) {
                    // This is a custom tag file that the user
                    // added for one specific job. We have no
                    // way of knowing what's required for this
                    // file because the tags don't have complete
                    // definitions, so return false. False also
                    // forces the UI to display the tag value form
                    // for this file.
                    return false;
                }
                var needsValue = (tag.required && !tag.emptyOk && !tag.systemMustSet());
                var hasValue = (!Util.isEmpty(tag.defaultValue) || !Util.isEmpty(tag.userValue));
                if (needsValue && !hasValue) {
                    return false;
                }
            }
        }
        return true;
    }
    // ---------------------------------------------------------
    // TODO: Move to validator.
    // ---------------------------------------------------------
    /**
      * Returns a hash, where key is tag file name and value is true/false,
      * indicating whether are required values in that file are present.
      * Used in job.js to validate that tag files have all required values.
      *
      * @returns {Object<string, boolean>}
      */
    tagFileCompletionStatus() {
        var status = {};
        for (var fileName of this.requiredTagFileNames()) {
            status[fileName] = this.fileHasAllRequiredValues(fileName);
        }
        return status;
    }
    /**
      * Returns true if this profile says the bag must be tarred.
      *
      * @returns {boolean}
      */
    mustBeTarred() {
        return (this.acceptSerialization &&
                this.acceptSerialization.length == 1 &&
                this.acceptSerialization[0] == "application/tar" &&
                this.serialization == "required");
    }
    /**
      * This converts the stored representation, which is basically
      * a JSON hash, to a full-fledged BagItProfile object.
      *
      * See also {@link BagItProfile.load}
      *
      * @param {string} jsonString - String of JSON to covert to BagItProfile.
      *
      * @throws {SyntaxError} - Throws SyntaxError if jsonString cannot be parsed.
      *
      * @returns {BagItProfile}
      */
    static fromJson(jsonString) {
        var profile = null;
        var obj = JSON.parse(jsonString);
        if (obj != null) {
            profile = new BagItProfile();
            Object.assign(profile, obj);
            obj.tags.forEach(function(item, index, array) {
                // Convert the JSON data to a full TagDefinition object.
                var tagDef = new TagDefinition();
                Object.assign(tagDef, item);
                profile.tags[index] = tagDef;
            });
        }
        return profile;
    }
    /**
     * This loads a BagItProfile from a JSON file and returns
     * the BagItProfile object. After you've loaded the profile,
     * you can call the validate() method to make sure it's valid.
     *
     * This is a synchronous operation, and will throw errors if
     * file does not exist, is not readable, JSON is invalid, etc.
     *
     * See also {@link BagItProfile.fromJson}
     *
     * @param {string} pathToJsonFile - The path to the JSON file that
     * contains the profile you want to load.
     *
     * @returns {BagItProfile}
     */
    static load(pathToJsonFile) {
        let json = fs.readFileSync(pathToJsonFile);
        return BagItProfile.fromJson(json);
    }
    /**
      * Returns the best guess at bag title by checking
      * tags called 'Title' or that include 'Title' in the
      * tag files.
      *
      * @returns {string}
      */
    bagTitle() {
        var exactTitle = "";
        var maybeTitle = "";
        for(var tag of this.tags) {
            var tagName = tag.tagName.toLowerCase();
            if (tagName == "title") {
                exactTitle = tag.userValue;
            } else if (tagName.includes("title")) {
                maybeTitle = tag.userValue;
            }
        }
        return exactTitle || maybeTitle;
    }
    /**
      * Returns the best guess at bag description by checking
      * tags called 'Internal-Sender-Description' and 'Description'
      * in the tag files.
      *
      * @returns {string}
      */
    bagDescription() {
        var exactDesc = "";
        var maybeDesc = "";
        for(var tag of this.tags) {
            var tagName = tag.tagName.toLowerCase();
            if (tagName == "internal-sender-description") {
                exactDesc = tag.userValue;
            } else if (tagName.includes("description")) {
                maybeDesc = tag.userValue;
            }
        }
        return exactDesc || maybeDesc;
    }
    /**
      * Returns the bag's Internal-Sender-Identifier as specified
      * in the tag files, or an empty string if there is none.
      * It's common for this tag to appear in a tag file with no
      * value, which also leads to an empty string return value.
      *
      * Also note that this returns the value of the first
      * Internal-Sender-Identfier tag in the bag-info.txt file.
      *
      * @returns {string}
      */
    bagInternalIdentifier() {
        let tags = this.getTagsFromFile('bag-info.txt', 'Internal-Sender-Identifier');
        return tags.length > 0 ? tags[0].userValue : '';
    }
    /**
      * Copy default tag values from other profile to this profile,
      * and saves those changes to the data store.
      *
      * If multiple tags with the same name appear in the same
      * tag file, this copies only the first value. While the BagIt
      * spec permits multiple instances of a tag within a file, we're
      * assuming (naively?) that a BagItProfile will specify only one
      * default value for a tag in a given file.
      *
      * @param {BagItProfile} otherProfile - The BagItProfile whose
      * TagDefinition default values you want to copy.
      *
      */
    copyDefaultTagValuesFrom(otherProfile) {
        var changed = false;
        for(var t of otherProfile.tags) {
            var tags = this.getTagsFromFile(t.tagFile, t.tagName);
            if (tags[0] && t.tagFile == tags[0].tagFile && !Util.isEmpty(t.defaultValue)) {
                tags[0].defaultValue = t.defaultValue;
                changed = true;
            }
        }
        if (changed) {
            this.save();
        }
    }

    // TODO: Move this to a plugin
    isDPNProfile() {
        return (this.id == builtinProfiles.DPNProfileId || this.baseProfileId == builtinProfiles.DPNProfileId);
    }

    // TODO: Move this to a plugin
    setDPNIdTags(uuid) {
        var dpnIdTag = this.findTagByName("DPN-Object-ID");
        if (dpnIdTag != null) {
            dpnIdTag.userValue = uuid;
        }
        // As of early 2018, DPN only supports first version bags,
        // so First-Version-Object-ID will always match DPN-Object-ID.
        var firstVersionTag = this.findTagByName("First-Version-Object-ID");
        if (firstVersionTag != null) {
            firstVersionTag.userValue = uuid;
        }
    }
};

module.exports.BagItProfile = BagItProfile;
