const { Context } = require('../core/context');
const { PersistentObject } = require('../core/persistent_object');
const { Util } = require('../core/util');
const { ValidationResult } = require('../core/validation_result');

/**
 * BagItProfile describes what constitutes a valid bag.
 * These profiles are based on the BagIt profiles described
 * in https://github.com/bagit-profiles/bagit-profiles, with
 * some changes and additions.
 *
 * @see {@link https://github.com/bagit-profiles/bagit-profiles|Standard BagIt Profiles}
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
        this.name = name || 'New BagIt Profile';
        this.description = description || 'New custom BagIt profile';
        this.acceptBagItVersion = ['0.97'];
        this.acceptSerialization = ['tar'];
        this.allowFetchTxt = false;
        this.allowMiscTopLevelFiles = false;
        this.allowMiscDirectories = false;
        this.bagItProfileInfo = new BagItProfileInfo();
        this.manifestsRequired = ['sha256'];
        this.tagManifestsRequired = [];
        this.requiredTags = [];
        this.serialization = "optional";

        // baseProfileId allows us to track whether this profile
        // is based on a built-in. If so, we don't allow the user
        // to modify certain elements of the profile. This will
        // be blank for many profiles.
        this.baseProfileId = "";
        this.isBuiltIn = false;

        this._addStandardBagItFile();
        this._addStandardBagInfoFile();
    }

    _addStandardBagItFile() {
        // BagIt spec says these two tags in bagit.txt file
        // are always required.
        var version = new TagDefinition('bagit.txt', 'BagIt-Version');
        version.required = true;
        version.emptyOk = false;
        version.values = Const.BagItVersions;
        version.defaultValue = "0.97";
        version.help = "Which version of the BagIt specification describes this bag's format?";
        var encoding = new TagDefinition('bagit.txt', 'Tag-File-Character-Encoding');
        encoding.required = true;
        encoding.emptyOk = false;
        encoding.defaultValue = "UTF-8";
        encoding.help = "How are this bag's plain-text tag files encoded? (Hint: usually UTF-8)";
        this.requiredTags.push(version);
        this.requiredTags.push(encoding);
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
            if(this.findTagByFileAndName('bag-info.txt', tagName) == null) {
                var t = new TagDefinition('bag-info.txt', tagName);
                t.required = false;
                t.emptyOk = true;
                this.requiredTags.push(t);
            }
        }
    }


    validate() {
        var result = new ValidationResult();
        if (Util.isEmpty(this.id)) {
            result.errors["id"] = "Id cannot be empty";
        }
        if (Util.isEmpty(this.name)) {
            result.errors["name"] = "Name cannot be empty";
        }
        if (Util.isEmptyArray(this.acceptBagItVersion)) {
            result.errors["acceptBagItVersion"] = "Profile must accept at least one BagIt version.";
        }
        if (Util.isEmptyArray(this.manifestsRequired)) {
            result.errors["manifestsRequired"] = "Profile must require at least one manifest.";
        }
        if (!this.hasRequiredTagFile("bagit.txt")) {
            result.errors["requiredTags"] = "Profile lacks requirements for bagit.txt tag file.";
        }
        if (!this.hasRequiredTagFile("bag-info.txt")) {
            result.errors["requiredTags"] = "Profile lacks requirements for bag-info.txt tag file.";
        }
        return result;
    }


    findMatching(property, value) {
        return this.requiredTags.filter(tag => tag[property] === value);
    }

    firstMatching(property, value) {
        return this.requiredTags.find(tag => tag[property] === value);
    }

    getTagsFromFile(filename, tagname) {
        return this.requiredTags.filter(tag => tag.tagFile === filename && tag.tagName === tagname);
    }

    hasRequiredTagFile(filename) {
        return typeof this.requiredTags.find(tag => tag.tagFile === filename) != undefined;
    }

    suggestBagName() {
        var suggestion = "";
        if (this.hasRequiredTagFile("aptrust-info.txt")) {
            var setting = AppSetting.findByName("Institution Domain")
            suggestion = `${setting.value}.bag-${Date.now()}`
        } else if (this.hasRequiredTagFile("dpn-tags/dpn-info.txt")) {
            suggestion = Util.uuid4();
        } else {
            suggestion = BagItProfile.suggestGenericBagName();
        }
        return suggestion;
    }
    static suggestGenericBagName() {
        return `bag-${Date.now()}`;
    }
    static nameLooksLegal(name) {
        var illegal = /[<>:"\/\|\?\*\\\s\t\n]/g;
        return !Util.isEmpty(name) && name.match(illegal) == null;
    }

    isValidBagName(name) {
        if (Util.isEmpty(name)) {
            return false;
        }
        if (this.hasRequiredTagFile("aptrust-info.txt")) {
            var setting = AppSetting.findByName("Institution Domain")
            var requiredPrefix = `${setting.value}.`;
            return (name.startsWith(requiredPrefix) &&
                    name.length > requiredPrefix.length &&
                    BagItProfile.nameLooksLegal(name));
        } else if (this.hasRequiredTagFile("dpn-tags/dpn-info.txt")) {
            return Util.looksLikeUUID(name);
        } else {
            BagItProfile.nameLooksLegal(name)
        }
    }

    tagsGroupedByFile() {
        // Returns a hash of required tags, with filename
        // as the key. Value is a list of required tags,
        // in alpha order by name.
        var tagsByFile = {};
        for (var tag of this.requiredTags) {
            if(tagsByFile[tag.tagFile] == null) {
                tagsByFile[tag.tagFile] = [];
            }
            tagsByFile[tag.tagFile].push(tag);
        }
        for (var f of Object.keys(tagsByFile)) {
            Util.sortByName(tagsByFile[f]);
        }
        return tagsByFile;
    }
    // getTagFileContents(tagFile) returns a string that you can
    // write to the tag file when creating a bag. Use requiredTagFileNames
    // to get all tag file names.
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
    // returns true if filename is a custom file added for a
    // specific job (i.e. is not part of the core profile)
    // All tags in a custom tag file have addedForJob = true.
    isCustomTagFile(filename) {
        for (var tag of this.requiredTags) {
            if (tag.tagFile == filename && tag.addedForJob == true) {
                return true;
            }
        }
        return false;
    }
    // Returns the names of all required tag files.
    requiredTagFileNames() {
        var fileNames = new Set();
        for (var tag of this.requiredTags) {
            if (!fileNames.has(tag.tagFile)) {
                fileNames.add(tag.tagFile);
            }
        }
        return Array.from(fileNames);
    }
    // Returns true if the specified tag file has values for all
    // required tags.
    fileHasAllRequiredValues(tagFileName) {
        for (var tag of this.requiredTags) {
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
    // Returns a hash, where key is tag file name and value is true/false,
    // indicating whether are required values in that file are present.
    // Used in job.js to validate that tag files have all required values.
    tagFileCompletionStatus() {
        var status = {};
        for (var fileName of this.requiredTagFileNames()) {
            status[fileName] = this.fileHasAllRequiredValues(fileName);
        }
        return status;
    }
    // Returns true if this profile says the bag must be tarred.
    mustBeTarred() {
        return (this.acceptSerialization &&
                this.acceptSerialization.length == 1 &&
                this.acceptSerialization[0] == "application/tar" &&
                this.serialization == "required");
    }
    // Convert the stored representation, which is basically a hash,
    // to a full-fledged BagItProfile object.
    static toFullObject(obj) {
        var profile = null;
        if (obj != null) {
            profile = new BagItProfile();
            Object.assign(profile, obj);
            obj.requiredTags.forEach(function(item, index, array) {
                // Convert the JSON data to a full TagDefinition object.
                var tagDef = new TagDefinition();
                Object.assign(tagDef, item);
                profile.requiredTags[index] = tagDef;
            });
        }
        return profile;
    }

    // Best guess at bag title.
    bagTitle() {
        var exactTitle = "";
        var maybeTitle = "";
        for(var tag of this.requiredTags) {
            var tagName = tag.tagName.toLowerCase();
            if (tagName == "title") {
                exactTitle = tag.userValue;
            } else if (tagName.includes("title")) {
                maybeTitle = tag.userValue;
            }
        }
        return exactTitle || maybeTitle;
    }

    // Best guess at bag description.
    bagDescription() {
        var exactDesc = "";
        var maybeDesc = "";
        for(var tag of this.requiredTags) {
            var tagName = tag.tagName.toLowerCase();
            if (tagName == "internal-sender-description") {
                exactDesc = tag.userValue;
            } else if (tagName.includes("description")) {
                maybeDesc = tag.userValue;
            }
        }
        return exactDesc || maybeDesc;
    }


    bagInternalIdentifier() {
        for(var tag of this.requiredTags) {
            var tagName = tag.tagName.toLowerCase();
            if (tagName == "internal-sender-identifier") {
                return tag.userValue;
            }
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

    // Copy default tag values from other profile to this profile.
    copyDefaultTagValuesFrom(otherProfile) {
        var changed = false;
        for(var t of otherProfile.requiredTags) {
            var tag = this.findTagByName(t.tagName);
            if (tag && t.tagFile == tag.tagFile && !Util.isEmpty(t.defaultValue)) {
                tag.defaultValue = t.defaultValue;
                //console.log(`Set default for ${tag.tagName} to ${tag.defaultValue}`)
                changed = true;
            }
        }
        if (changed) {
            this.save();
        }
    }

};

module.exports.BagItProfile = BagItProfile;
