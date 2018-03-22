const path = require('path');
const builtinProfiles = require('./builtin_profiles');
const { AppSetting } = require('./app_setting');
const { BagItProfileInfo } = require('./bagit_profile_info');
const { Choice } = require('./choice');
const Const = require('./constants');
const { Field } = require('./field');
const { Form } = require('./form');
const { TagDefinition } = require('./tag_definition');
const { Util } = require('./util');
const { ValidationResult } = require('./validation_result');

const Store = require('electron-store');
var db = new Store({name: 'bagit-profiles'});

class BagItProfile {
    constructor() {
        // name and description are not part of BagItProfile standard
        this.id = Util.uuid4();
        this.name = "";
        this.description = "";
        this.acceptBagItVersion = [];
        this.acceptSerialization = [];
        this.allowFetchTxt = false;
        this.allowMiscTopLevelFiles = false;
        this.allowMiscDirectories = false;
        this.bagItProfileInfo = new BagItProfileInfo();
        this.manifestsRequired = [];
        this.requiredTags = [];
        this.serialization = "optional";
        this.tagManifestsRequired = [];

        // baseProfileId allows us to track whether this profile
        // is based on a built-in. If so, we don't allow the user
        // to modify certain elements of the profile. This will
        // be blank for many profiles.
        this.baseProfileId = "";
        this.isBuiltIn = false;

        // BagIt spec says these two tags in bagit.txt file
        // are always required.
        var v = new TagDefinition('bagit.txt', 'BagIt-Version');
        v.required = true;
        v.emptyOk = false;
        v.values = Const.BagItVersions;
        v.defaultValue = "0.97";
        v.help = "Which version of the BagIt specification describes this bag's format?";
        var e = new TagDefinition('bagit.txt', 'Tag-File-Character-Encoding');
        e.required = true;
        e.emptyOk = false;
        e.defaultValue = "UTF-8";
        e.help = "How are this bag's plain-text tag files encoded? (Hint: usually UTF-8)";
        this.requiredTags.push(v);
        this.requiredTags.push(e);
    }
    objectType() {
        return 'BagItProfile';
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
    toForm() {
        var form = new Form('bagItProfileForm');
        form.fields['id'] = new Field('bagItProfileId', 'id', 'id', this.id);
        form.fields['name'] = new Field('bagItProfileName', 'name', 'Name', this.name);
        form.fields['description'] = new Field('bagItProfileDescription',
                                               'description',
                                               'Description',
                                               this.description);

        form.fields['acceptBagItVersion'] = new Field('bagItProfileAcceptBagItVersion',
                                                      'acceptBagItVersion',
                                                      'BagIt Version',
                                                      this.acceptBagItVersion);
        form.fields['acceptBagItVersion'].help = "Which versions of the BagIt standard are allowed for this profile?";
        form.fields['acceptBagItVersion'].choices = Choice.makeList(Const.BagItVersions, this.acceptBagItVersion, false);
        form.fields['acceptBagItVersion'].attrs['multiple'] = true;

        form.fields['allowFetchTxt'] = new Field('bagItProfileAllowFetchTxt',
                                                'allowFetchTxt',
                                                'Allow Fetch File',
                                                this.allowFetchTxt);
        form.fields['allowFetchTxt'].choices = Choice.makeList(Const.YesNo, this.allowFetchTxt, true);
        form.fields['allowFetchTxt'].help = "Are fetch.txt files allowed? These files contain URLs of files that should be part of the bag.";
        form.fields['allowMiscTopLevelFiles'] = new Field('bagItProfileAllowMiscTopLevelFiles',
                                                'allowMiscTopLevelFiles',
                                                'Allow Miscellaneous Top-Level Files',
                                                this.allowMiscTopLevelFiles);
        form.fields['allowMiscTopLevelFiles'].help = "Can the bag contain files in the top-level directory other than manifests, tag manifests, and standard tag files like bagit.txt and bag-info.txt?";
        form.fields['allowMiscTopLevelFiles'].choices = Choice.makeList(Const.YesNo, this.allowMiscTopLevelFiles, true);

        form.fields['allowMiscDirectories'] = new Field('bagItProfileAllowMiscDirectories',
                                                'allowMiscDirectories',
                                                'Allow Miscellaneous Top-Level Directories',
                                                this.allowMiscDirectories);
        form.fields['allowMiscDirectories'].help = "Can the bag contain directories other than 'data' in the top-level directory?";
        form.fields['allowMiscDirectories'].choices = Choice.makeList(Const.YesNo, this.allowMiscDirectories, true);

        form.fields["infoIdentifier"] = new Field("bagItProfileInfoIdentifier",
                                                 "infoIdentifier",
                                                 "BagIt Profile Identifier",
                                                 this.bagItProfileInfo.bagItProfileIdentifier);
        form.fields["infoIdentifier"].help = "The official URL where this BagIt profile is publicly available. Leave this blank if you're not publishing this BagIt profile.";

        form.fields["infoContactEmail"] = new Field("bagItProfileInfoContactEmail",
                                                 "infoContactEmail",
                                                 "Email Address of Profile Maintainer",
                                                 this.bagItProfileInfo.contactEmail);
        form.fields["infoContactEmail"].help = "Leave this blank if you're not publishing this BagIt profile.";
        form.fields["infoContactName"] = new Field("bagItProfileInfoContactName",
                                                 "infoContactName",
                                                 "Name of Profile Maintainer",
                                                 this.bagItProfileInfo.contactName);
        form.fields["infoContactName"].help = "Leave this blank if you're not publishing this BagIt profile.";
        form.fields["infoExternalDescription"] = new Field("bagItProfileInfoExternalDescription",
                                                 "infoExternalDescription",
                                                 "External Description",
                                                 this.bagItProfileInfo.externalDescription);
        form.fields["infoExternalDescription"].help = "A description of this profile for people outside your organization. Leave this blank if you're not publishing this BagIt profile.";
        form.fields["infoSourceOrganization"] = new Field("bagItProfileInfoSourceOrganization",
                                                 "infoSourceOrganization",
                                                 "Source Organization",
                                                 this.bagItProfileInfo.sourceOrganization);
        form.fields["infoExternalDescription"].help = "The name of the organization that maintains this profile. Leave this blank if you're not publishing this BagIt profile.";
        form.fields["infoVersion"] = new Field("bagItProfileInfoVersion",
                                                 "infoVersion",
                                                 "Version",
                                                 this.bagItProfileInfo.version);
        form.fields["infoExternalDescription"].help = "The version number for this profile.";

        form.fields['manifestsRequired'] = new Field('bagItProfileManifestsRequired',
                                                     'manifestsRequired',
                                                     'Required Manifests',
                                                     this.manifestsRequired);
        form.fields['manifestsRequired'].choices = Choice.makeList(Const.DigestAlgorithms, this.manifestsRequired, false);
        form.fields['manifestsRequired'].help = "Which payload manifests must be present in the bag? The BagIt standard requires at least one.";
        form.fields['manifestsRequired'].attrs['multiple'] = true;

        form.fields['tagManifestsRequired'] = new Field('bagItProfileTagManifestsRequired',
                                                     'tagManifestsRequired',
                                                     'Required Tag Manifests',
                                                     this.tagManifestsRequired);
        form.fields['tagManifestsRequired'].choices = Choice.makeList(Const.DigestAlgorithms, this.tagManifestsRequired, false);
        form.fields['tagManifestsRequired'].help = "Which tag manifests must be present in the bag? Choose zero or more.";
        form.fields['tagManifestsRequired'].attrs['multiple'] = true;

        form.fields['serialization'] = new Field('bagItProfileSerialization',
                                                 'serialization',
                                                 'Serialization',
                                                 this.serialization);
        form.fields['serialization'].choices = Choice.makeList(Const.RequirementOptions, this.serialization, true);
        form.fields['serialization'].help = "Should the bag serialized into a single file?";

        // Don't allow users to edit built-in profile definitions.
        // The can add tags and edit default tag values, but that's all.
        if (this.isBuiltIn) {
            var readOnly = ['acceptBagItVersion',
                            'allowFetchTxt',
                            'allowMiscTopLevelFiles',
                            'allowMiscDirectories',
                            'infoIdentifier',
                            'infoContactEmail',
                            'infoContactName',
                            'infoExternalDescription',
                            'infoSourceOrganization',
                            'infoVersion',
                            'manifestsRequired',
                            'tagManifestsRequired',
                            'serialization'];
            // Using disabled because user can still edit readonly fields in Electron.
            for(var name of readOnly) {
                form.fields[name].attrs['disabled'] = true;
            }
        }

        return form;
    }
    static fromForm() {
        var id = $('#bagItProfileId').val().trim();
        var profile = BagItProfile.find(id) || new BagItProfile();
        profile.id = id;
        profile.name = $('#bagItProfileName').val().trim();
        profile.description = $('#bagItProfileDescription').val().trim();
        profile.acceptBagItVersion = Util.filterEmpties($('#bagItProfileAcceptBagItVersion').val());
        profile.allowFetchTxt = Util.boolValue($('#bagItProfileAllowFetchTxt').val().trim());
        profile.allowMiscTopLevelFiles = Util.boolValue($('#bagItProfileAllowMiscTopLevelFiles').val().trim());
        profile.allowMiscDirectories = Util.boolValue($('#bagItProfileAllowMiscDirectories').val().trim());
        profile.bagItProfileInfo.bagItProfileIdentifier = $('#bagItProfileInfoIdentifier').val().trim();
        profile.bagItProfileInfo.contactEmail = $('#bagItProfileInfoContactEmail').val().trim();
        profile.bagItProfileInfo.contectName = $('#bagItProfileInfoContactName').val().trim();
        profile.bagItProfileInfo.externalDescription = $('#bagItProfileInfoExternalDescription').val().trim();
        profile.bagItProfileInfo.sourceOrganization = $('#bagItProfileInfoSourceOrganization').val().trim();
        profile.bagItProfileInfo.version = $('#bagItProfileInfoVersion').val().trim();
        profile.manifestsRequired = Util.filterEmpties($('#bagItProfileManifestsRequired').val());
        profile.serialization = $('#bagItProfileSerialization').val().trim();
        profile.tagManifestsRequired = Util.filterEmpties($('#bagItProfileTagManifestsRequired').val());
        // Because each tag definition in profile.requiredTags is saved as it is
        // edited, we don't need to load them from the form. They should have come
        // out of the db when we called BagItProfile.find(id) above.
        return profile;
    }
    findTagById(id) {
        for(var t of this.requiredTags) {
            if (t.id == id) {
                return t;
            }
        }
        return null;
    }
    // Returns the FIRST tag with a matching name.
    findTagByName(name) {
        for(var t of this.requiredTags) {
            if (t.tagName == name) {
                return t;
            }
        }
        return null;
    }
    firstTagWithMatchingName(listOfNames) {
        for(var name of listOfNames) {
            var tag = this.findTagByName(name);
            if (tag != null) {
                return tag;
            }
        }
        return null;
    }
    hasRequiredTagFile(filename) {
        for (var tag of this.requiredTags) {
            if (tag.tagFile == filename) {
                return true;
            }
        }
        return false;
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
        if (name == null || name == "") {
            return false;
        }
        var illegal = /[<>:"\/\|\?\*\\\s\t\n]/g;
        return name.match(illegal) == null;
    }
    isValidBagName(name) {
        if (name == null || name == "") {
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
    tagsGroupedByFile(sortByName = true) {
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
        if (sortByName) {
            for (var f of Object.keys(tagsByFile)) {
                Util.sortByName(tagsByFile[f]);
            }
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
    toBagItProfileJson() {
        // Return a string of JSON in BagItProfile format,
        // with all the bad keys they use.
    }
    // Returns true if this profile says the bag must be tarred.
    mustBeTarred() {
        return (this.acceptSerialization &&
                this.acceptSerialization.length == 1 &&
                this.acceptSerialization[0] == "application/tar" &&
                this.serialization == "required");
    }
    static fromStandardJson(jsonString) {
        // Parse JSON from BagItProfile format, with the bad
        // keys they use. Return a BagItProfile object.
        var obj = JSON.parse(jsonString)
        return BagItProfile.fromStandardObject(obj)
    }
    // Used in early versions of DART, and may be used later
    // to import other profiles. This function converts standard
    // BagIt Profiles to our format.
    static fromStandardObject(obj) {
        var p = new BagItProfile();
        p.acceptBagItVersion = obj["Accept-BagIt-Version"];
        p.acceptSerialization = obj["Accept-Serialization"];
        p.allowFetchTxt = obj["Allow-Fetch.txt"];
        p.allowMiscTopLevelFiles = obj["Allow-Misc-Top-Level-Files"];
        p.allowMiscDirectories = obj["Allow-Misc-Directories"];
        p.manifestsRequired = obj["Manifests-Required"];
        p.serialization = obj["Serialization"];
        p.tagManifestsRequired = obj["Tag-Manifests-Required"];

        p.bagItProfileInfo = new BagItProfileInfo();
        p.bagItProfileInfo.bagItProfileIdentifier = obj["BagIt-Profile-Info"]["BagIt-Profile-Identifier"];
        p.bagItProfileInfo.contactEmail = obj["BagIt-Profile-Info"]["Contact-Email"];
        p.bagItProfileInfo.contactName = obj["BagIt-Profile-Info"]["Contact-Name"];
        p.bagItProfileInfo.externalDescription = obj["BagIt-Profile-Info"]["External-Description"];
        p.bagItProfileInfo.sourceOrganization = obj["BagIt-Profile-Info"]["Source-Organization"];
        p.bagItProfileInfo.version = obj["BagIt-Profile-Info"]["Version"];

        // Get rid of the default BagIt-Version and Tag-File-Character-Encoding
        // required tags created by the constructor. The profile we're importing
        // should set these as it likes.
        p.requiredTags = [];

        // Copy required tag definitions to our preferred structure.
        // The BagIt profiles we're transforming don't have default values for tags.
        for (var fileName of Object.keys(obj["Tag-Files-Required"])) {
            var tags = obj["Tag-Files-Required"][fileName]
            for (var tagName of Object.keys(tags)) {
                var originalDef = tags[tagName];
                var tagDef = new TagDefinition(fileName, tagName);
                tagDef.required = originalDef["required"] || false;
                tagDef.emptyOk = originalDef["emptyOk"] || false;
                tagDef.values = originalDef["values"] || [];
                tagDef.defaultValue = originalDef["defaultValue"] || null;
                if (Array.isArray(originalDef["values"]) && originalDef["values"].length == 1) {
                    tagDef.defaultValue = originalDef["values"][0];
                }
                p.requiredTags.push(tagDef);
            }
        }
        return p;
    }
    setTagValuesFromJobForm() {
        var textareas = $('textarea [data-for=tagValue]');
        for (var t in textareas) {
            var tagId = t.attr('id');
            var tag = this.findTagById(tagId);
            tag.userValue = t.val();
        }
    }
    save() {
        return db.set(this.id, this);
    }
    static find(id) {
        var obj = db.get(id);
        return BagItProfile.toFullObject(obj);
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

    delete() {
        db.delete(this.id);
        return this;
    }
    static storeIsEmpty() {
        return (Object.keys(db.store).length == 0);
    }

    // TODO: Much of getStore, list, nextLink, and previousLink
    // is common to AppSetting, BagItProfile, Job, and StorageService.
    // Factor this out to common code.
    static getStore() {
        return db.store;
    }
    static list(limit = 50, offset = 0) {
        var items = [];
        var allItems = Util.sortByName(db.store);
        var end = Math.min((offset + limit), allItems.length);
        for (var i = offset; i < end; i++) {
            items.push(allItems[i]);
        }
        return items;
    }
    static nextLink(limit = 50, offset = 0) {
        if (offset + limit < Object.keys(db.store).length) {
            var nextOffset = offset + limit
            return `bagItProfileShowList('', ${limit}, ${nextOffset})`;
        }
        return "";
    }
    static previousLink(limit = 50, offset = 0) {
        if (offset > 0) {
            var prevOffset = Math.max((offset - limit), 0);
            return `bagItProfileShowList('', ${limit}, ${prevOffset})`;
        }
        return "";
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
    isDPNProfile() {
        return (this.id == builtinProfiles.DPNProfileId || this.baseProfileId == builtinProfiles.DPNProfileId);
    }
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

    static createProfileFromBuiltIn(builtinId, tagAsCopy) {
        var profile = null;
        if (builtinId == builtinProfiles.APTrustProfileId) {
            profile = BagItProfile.toFullObject(builtinProfiles.APTrustProfile);
        } else if (builtinId == builtinProfiles.DPNProfileId) {
            profile = BagItProfile.toFullObject(builtinProfiles.DPNProfile);
        } else {
            throw new Error("Unknown builtin profile id " + builtinId);
        }
        for(var t of profile.requiredTags) {
            t.isBuiltIn = true;
        }
        if (tagAsCopy) {
            profile.id = es.Util.uuid4();
            profile.name = `Copy of ${profile.name}`;
            profile.description = `Copy of ${profile.description}`;
            profile.baseProfileId = builtinId;
            profile.isBuiltIn = false;
        } else {
            profile.isBuiltIn = true;
        }
        profile.save();
        return profile;
    }

};

module.exports.BagItProfile = BagItProfile;
