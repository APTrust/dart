const { AppSetting } = require('../core/app_setting');
const { BagItProfileInfo } = require('./bagit_profile_info');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { PersistentObject } = require('../core/persistent_object');
const { TagDefinition } = require('./tag_definition');
const { Util } = require('../core/util');

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
 * @param {object} opts - Object containing properties to set.
 *
 * @param {string} opts.id - A UUID in hex-string format. This is
 * the object's unique identifier.
 *
 * @param {boolean} opts.userCanDelete - Indicates whether user is
 * allowed to delete this record.
 *
 * @param {string} opts.name - The name this profile.
 * @default 'New BagIt Profile'
 * @param {string} opts.description - A helpful description of the profile
 * for people who will be using it.
 * @default 'New custom BagIt profile'
 */
class BagItProfile extends PersistentObject {

    constructor(opts = {}) {
        opts.type = 'BagItProfile'
        super(opts);
        /**
          * Name is the name of this profile.
          * Names should be unique, to prevent confusion.
          *
          * @type {string}
          */
        this.name = opts.name || 'New BagIt Profile';
        /**
          * The description of this profile should be meaningful to the user.
          *
          * @type {string}
          */
        this.description = opts.description || 'New custom BagIt profile';
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
        this.allowFetchTxt = opts.allowFetchTxt === true ? true : false;
        /**
          * Describes whether bags conforming to this profile
          * may include files in the top-level folder other
          * than manifests, tag manifests, and the required tag
          * files listed in the {@link tags} list.
          *
          * @type {boolean}
          * @default false
          */
        this.allowMiscTopLevelFiles = opts.allowMiscTopLevelFiles === true ? true : false;
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
        this.allowMiscDirectories = opts.allowMiscDirectories === true ? true : false;
        /**
          * This contains metadata about the BagIt profile
          * itself, such as who publishes and maintains it.
          *
          * @type {BagItProfileInfo}
          */
        this.bagItProfileInfo = opts.bagItProfileInfo || new BagItProfileInfo();
        /**
          * A list of algorithms of required manifests.
          * For example, 'sha256' indicates that bags conforming
          * to this profile must have a manifest-sha256.txt file.
          *
          * @type {string[]}
          * @default ['sha256']
          */
        this.manifestsRequired = opts.manifestsRequired || ['sha256'];
        /**
          * A list of algorithms of required tag manifests.
          * For example, 'sha256' indicates that bags conforming
          * to this profile must have a tagmanifest-sha256.txt file.
          * Leave this empty if no tag manifests are required.
          *
          * @type {string[]}
          * @default []
          */
        this.tagManifestsRequired = opts.tagManifestsRequired || [];
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
        this.tags = opts.tags || [];
        /**
          * Describes whether bags conforming to this profile may or
          * may not be serialized. Allowed values are 'required',
          * 'optional', and 'forbidden'.
          *
          * @type {string}
          * @default 'optional'
          */
        this.serialization = opts.serialization || "optional";
        /**
          * baseProfileId allows us to track whether this profile
          * is based on a built-in. If so, we don't allow the user
          * to modify certain elements of the profile. This will
          * be blank for many profiles.
          *
          * @type {string}
          * @default null
          */
        this.baseProfileId = opts.baseProfileId || null;
        /**
          * Describes whether this profile is built into the application.
          * Builtin profiles cannot be deleted by users.
          *
          * @type {boolean}
          * @default false
          */
        this.isBuiltIn = opts.isBuiltIn === true ? true : false;
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
        this.tarDirMustMatchName = opts.tarDirMustMatchName === true ? true : false;
        /**
         * Contains information describing validation errors. Key is the
         * name of the invalid field. Value is a description of why the
         * field is not valid.
         *
         * @type {Object<string, string>}
         */
        this.errors = {};

        this._addStandardBagItFile();
        this._addStandardBagInfoFile();
    }

    _addStandardBagItFile() {
        // BagIt spec says these two tags in bagit.txt file
        // are always required.
        if(this.getTagsFromFile('bagit.txt', 'Bagit-Version').length == 0) {
            var version = new TagDefinition('bagit.txt', 'BagIt-Version');
            version.required = true;
            version.emptyOk = false;
            version.values = Constants.BAGIT_VERSIONS;
            version.defaultValue = "0.97";
            version.help = "Which version of the BagIt specification describes this bag's format?";

        }
        if(this.getTagsFromFile('bagit.txt', 'Tag-File-Character-Encoding').length == 0) {
            var encoding = new TagDefinition('bagit.txt', 'Tag-File-Character-Encoding');
            encoding.required = true;
            encoding.emptyOk = false;
            encoding.defaultValue = "UTF-8";
            encoding.help = "How are this bag's plain-text tag files encoded? (Hint: usually UTF-8)";
            this.tags.push(version);
            this.tags.push(encoding);
        }
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
     * validate returns true or false, indicating whether this object
     * contains complete and valid data. If it returns false, check
     * the errors property for specific errors.
     *
     * @returns {boolean}
     */
    validate() {
        super.validate();
        if (Util.isEmpty(this.name)) {
            this.errors["name"] = "Name cannot be empty.";
        }
        if (Util.isEmptyStringArray(this.acceptBagItVersion)) {
            this.errors["acceptBagItVersion"] = "Profile must accept at least one BagIt version.";
        }
        if (Util.isEmptyStringArray(this.manifestsRequired)) {
            this.errors["manifestsRequired"] = "Profile must require at least one manifest.";
        }
        if (!this.hasTagFile("bagit.txt")) {
            this.errors["tags"] = "Profile lacks requirements for bagit.txt tag file.";
        }
        if (!this.hasTagFile("bag-info.txt")) {
            this.errors["tags"] += "\nProfile lacks requirements for bag-info.txt tag file.";
        }
        if (!Util.listContains(Constants.REQUIREMENT_OPTIONS, this.serialization)) {
            this.errors["serialization"] = `Serialization must be one of: ${Constants.REQUIREMENT_OPTIONS.join(', ')}.`;
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * findMatchingTags returns an array of TagDefinition objects
     * matching the specified criteria.
     *
     * @see also {@link findMatchingTag}
     *
     * @param {string} property - The name of the TagDefinition
     * property to match. For example, 'tagName' or 'defaultValue'.
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
     * property to match. For example, 'tagName' or 'defaultValue'.
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
     * TODO: This belongs in a profile or in a vendor-specific module.
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
        return lines.join("\n") + "\n";
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
        return this.findExactOrPartial("title", "title");
    }

    /**
      * Returns the best guess at bag description by checking
      * tags called 'Internal-Sender-Description' and 'Description'
      * in the tag files.
      *
      * @returns {string}
      */
    bagDescription() {
        return this.findExactOrPartial("internal-sender-description", "description");
    }

    /**
      * Returns the value of the first tag whose name matches exactTagName,
      * or if there are none, the value of the the first tag whose name
      * contains partialTagName. Names are case insensitive.
      *
      * @returns {string}
      */
    findExactOrPartial(exactTagName, partialTagName) {
        var exactMatch = "";
        var partialMatch = "";
        var lcExactTagName = exactTagName.toLowerCase();
        var lcPartialTagName = partialTagName.toLowerCase();
        for(var tag of this.tags) {
            var tagName = tag.tagName.toLowerCase();
            if (tagName === lcExactTagName) {
                exactMatch = tag.getValue();
            } else if (tagName.includes(lcPartialTagName)) {
                partialMatch = tag.getValue();
            }
        }
        return exactMatch || partialMatch;
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
      * Copy default tag values from other profile to this profile.
      *
      * If multiple tags with the same name appear in the same
      * tag file, this copies only the first value. While the BagIt
      * spec permits multiple instances of a tag within a file, we're
      * assuming (naively?) that a BagItProfile will specify only one
      * default value for a tag in a given file.
      *
      * This method is generally used for cloning BagItProfiles.
      * If you want to copy userValues, for instance, when you're
      * creating a bag, see {@link mergeTagValues}.
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
            }
        }
    }

    /**
      * Copy values into the userValue field of this profile's tags.
      * Use this when you're creating a bag and you want to write actual
      * values into the bag's tag files (as opposed to when you are
      * creating a reusable BagItProfile).
      *
      * If multiple tags with the same name appear in the same
      * tag file, this copies only the first value. If a tag in the
      * tags param does not exist in the profile, it will be added
      * for one-time use. (That is, it will be added to the profile for
      * the scope of one bagging or validation operation, but will
      * not be saved as part of the reusable BagItProfile.)
      *
      * If you want to copy default values when cloning an existing
      * BagItProfile, see {@link copyDefaultValuesFrom}.
      *
      * @param {Array<TagDefinition>} tags - An array of tags whose
      * userValues you want to copy into this profile.
      *
      */
    mergeTagValues(tags) {
        for(var t of tags) {
            var existingTags = this.getTagsFromFile(t.tagFile, t.tagName);
            if (existingTags[0] && t.tagFile == existingTags[0].tagFile) {
                existingTags[0].userValue = t.userValue;
            } else if (!existingTags[0]) {
                this.tags.push(t);
            }
        }
    }

    /**
     * This creates a new BagItProfile or a vanilla data object that
     * contains the attributes of a BagItProfile. This is used by the
     * find() method to inflate a JSON hash retrieved from the DB into
     * a full-fledged BagItProfile object, and by the BagItProfileController
     * when creating a new BagItProfile based on an existing BagItProfile.
     *
     * If you intend to clone an existing profile to create a new one, be
     * sure to change the profile's id after cloning it. Otherwise, when you
     * save the new (cloned) profile, it will overwrite the old one in the DB.
     *
     * @param {BagItProfile|object} otherProfile - The BagItProfile you want
     * to copy, or a vanilla object that contains the same properties as a
     * BagItProfile (such as BagItProfile JSON record retrieved from the
     * DART database).
     *
     * @returns {BagItProfile}
     */
    static inflateFrom(otherProfile) {
        let profile = new BagItProfile();
        Object.assign(profile, otherProfile);
        profile.bagItProfileInfo = new BagItProfileInfo();
        Object.assign(profile.bagItProfileInfo, otherProfile.bagItProfileInfo);
        for (let i=0; i < otherProfile.tags.length; i++) {
            let tagDef = new TagDefinition();
            Object.assign(tagDef, otherProfile.tags[i]);
            profile.tags[i] = tagDef;
        }
        return profile;
    }


    /* ------- Implementation of PersistentObject methods -------- */

    /**
     * find finds the object with the specified id in the datastore
     * and returns it. Returns undefined if the object is not in the datastore.
     *
     * @param {string} id - The id (UUID) of the object you want to find.
     *
     * @returns {Object}
     */
    static find(id) {
        let data = Context.db('BagItProfile').get(id);
        if (data) {
            return BagItProfile.inflateFrom(data);
        }
        return undefined;
    }

    /**
     * sort sorts all of the items in the Conf datastore (JSON text file)
     * on the specified property in either 'asc' (ascending) or 'desc' (descending)
     * order. This does not affect the order of the records in the file, but
     * it returns a sorted list of objects.
     *
     * @param {string} property - The property to sort on.
     * @param {string} direction - Sort direction: 'asc' or 'desc'
     *
     * @returns {Object[]}
     */
    static sort(property, direction) {
        return PersistentObject.sort(Context.db('BagItProfile'), property, direction);
    }

    /**
     * findMatching returns an array of items matching the specified criteria.
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {string} property - The name of the property to match.
     * @param {string} value - The value of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {number} opts.limit - Limit to this many results.
     * @param {number} opts.offset - Start results from this offset.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending)
     * or 'desc'. Default is asc.
     *
     * @returns {Object[]}
     */
    static findMatching(property, value, opts) {
        return PersistentObject.findMatching(Context.db('BagItProfile'), property, value, opts);
    }

    /**
     * firstMatching returns the first item matching the specified criteria,
     * or null if no item matches.
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {string} property - The name of the property to match.
     * @param {string} value - The value of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending)
     * or 'desc'. Default is asc.
     *
     * @returns {Object}
     */
    static firstMatching(property, value, opts) {
        return PersistentObject.firstMatching(Context.db('BagItProfile'), property, value, opts);
    }

    /**
     * list returns an array of items matched by the filter function.
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {filterFunction} filterFunction - A function to filter out items
     * that should not go into the results.
     * @param {Object} opts - Optional additional params.
     * @param {number} opts.limit - Limit to this many results.
     * @param {number} opts.offset - Start results from this offset.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending)
     * or 'desc'. Default is asc.
     *
     * @returns {Object[]}
     */
    static list(filterFunction, opts) {
        return PersistentObject.list(Context.db('BagItProfile'), filterFunction, opts);
    }

    /**
     * first returns the first item matching that passes the filterFunction.
     * You can combine orderBy, sortDirection, and offset to get the second,
     * third, etc. match for the given criteria, but note that this function
     * only returns a single item at most (or null if there are no matches).
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {filterFunction} filterFunction - A function to filter out items that
     * should not go into the results.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending)
     * or 'desc'. Default is asc.
     * @param {number} opts.offset - Skip this many items before choosing
     * a result.
     *
     * @returns {Object}
     */
    static first(filterFunction, opts) {
        return PersistentObject.first(Context.db('BagItProfile'), filterFunction, opts);
    }

};

module.exports.BagItProfile = BagItProfile;
