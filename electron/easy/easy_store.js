const electron = require('electron')
var remote = require('electron').remote
const app = remote.app
const path = require('path')
const builtins = require(path.resolve('electron/easy/builtin_profiles'))

const TransferProtocols = ["ftp", "rsync", "s3", "sftp", "scp"];
const SerializationFormats = ["gzip", "tar", "zip"];
const BagItVersions = ["0.97"];
const DigestAlgorithms = ["md5", "sha1", "sha224", "sha256", "sha384", "sha512"];
const RequirementOptions = ["required", "optional", "forbidden"];
const YesNo = ["Yes", "No"];

const Store = require('electron-store');
var db = {};
db.appSettings = new Store({name: 'app-settings'});
db.bagItProfiles = new Store({name: 'bagit-profiles'});
db.storageServices = new Store({name: 'storage-services'});

// This will be set by application.js, based on current view.
var activeObject = null;

class AppSetting {
    constructor(name, value) {
        this.id = Util.uuid4();
        this.name = name;
        this.value = value;
    }
    validate() {
        var result = new ValidationResult();
        if (Util.isEmpty(this.id)) {
            result.errors["id"] = "Id cannot be empty";
        }
        if (Util.isEmpty(this.name)) {
            result.errors["name"] = "Name cannot be empty";
        }
        return result
    }
    toForm() {
        var form = new Form('appSettingForm');
        form.fields['id'] = new Field('appSettingId', 'id', 'id', this.id);
        form.fields['name'] = new Field('appSettingName', 'name', 'Name', this.name);
        form.fields['value'] = new Field('appSettingValue', 'value', 'Value', this.value);
        return form
    }
    static fromForm() {
        var name = $('#appSettingName').val().trim();
        var value = $('#appSettingValue').val().trim();
        var setting = new AppSetting(name, value);
        setting.id = $('#appSettingId').val().trim();
        return setting
    }
    save() {
        return db.appSettings.set(this.id, this);
    }
    static find(id) {
        var setting = null;
        var obj = db.appSettings.get(id);
        if (obj != null) {
            setting = new AppSetting();
            Object.assign(setting, obj);
        }
        return setting;
    }
    delete() {
        db.appSettings.delete(this.id);
        return this;
    }
}

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

        // BagIt spec says these two tags in bagit.txt file
        // are always required.
        var v = new TagDefinition('bagit.txt', 'BagIt-Version');
        v.required = true;
        v.emptyOk = false;
        v.values = BagItVersions;
        v.defaultValue = "0.97";
        var e = new TagDefinition('bagit.txt', 'Tag-File-Character-Encoding');
        e.required = true;
        e.emptyOk = false;
        e.defaultValue = "UTF-8";
        this.requiredTags.push(v);
        this.requiredTags.push(e);

        // We'll lock default APTrust and DPN BagItProfiles so
        // users can't edit anything other than default tag values.
        this.locked = false;
    }
    isBuiltin() {
        return (this.id == builtins.APTrustProfileId || this.id == builtins.DPNProfileId);
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
        form.fields['acceptBagItVersion'].choices = Choice.makeList(BagItVersions, this.acceptBagItVersion, false);
        form.fields['acceptBagItVersion'].attrs['multiple'] = true;

        form.fields['allowFetchTxt'] = new Field('bagItProfileAllowFetchTxt',
                                                'allowFetchTxt',
                                                'Allow Fetch File',
                                                this.allowFetchTxt);
        form.fields['allowFetchTxt'].choices = Choice.makeList(YesNo, this.allowFetchTxt, true);
        form.fields['allowMiscTopLevelFiles'] = new Field('bagItProfileAllowMiscTopLevelFiles',
                                                'allowMiscTopLevelFiles',
                                                'Allow Miscellaneous Top-Level Files',
                                                this.allowMiscTopLevelFiles);
        form.fields['allowMiscTopLevelFiles'].help = "Can the bag contain files in the top-level directory other than manifests, tag manifests, and standard tag files like bagit.txt and bag-info.txt?";
        form.fields['allowMiscTopLevelFiles'].choices = Choice.makeList(YesNo, this.allowMiscTopLevelFiles, true);

        form.fields['allowMiscDirectories'] = new Field('bagItProfileAllowMiscDirectories',
                                                'allowMiscDirectories',
                                                'Allow Miscellaneous Top-Level Directories',
                                                this.allowMiscDirectories);
        form.fields['allowMiscDirectories'].help = "Can the bag contain directories other than 'data' in the top-level directory?";
        form.fields['allowMiscDirectories'].choices = Choice.makeList(YesNo, this.allowMiscDirectories, true);

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
        form.fields['manifestsRequired'].choices = Choice.makeList(DigestAlgorithms, this.manifestsRequired, false);
        form.fields['manifestsRequired'].help = "Which payload manifests must be present in the bag? The BagIt standard requires at least one.";
        form.fields['manifestsRequired'].attrs['multiple'] = true;

        form.fields['tagManifestsRequired'] = new Field('bagItProfileTagManifestsRequired',
                                                     'tagManifestsRequired',
                                                     'Required Tag Manifests',
                                                     this.tagManifestsRequired);
        form.fields['tagManifestsRequired'].choices = Choice.makeList(DigestAlgorithms, this.tagManifestsRequired, false);
        form.fields['tagManifestsRequired'].help = "Which tag manifests must be present in the bag? Choose zero or more.";
        form.fields['tagManifestsRequired'].attrs['multiple'] = true;

        form.fields['serialization'] = new Field('bagItProfileSerialization',
                                                 'serialization',
                                                 'Serialization',
                                                 this.serialization);
        form.fields['serialization'].choices = Choice.makeList(RequirementOptions, this.serialization, true);
        form.fields['serialization'].help = "Should the bag serialized into a single file?";

        // Don't allow users to edit built-in profile definitions.
        // The can add tags and edit default tag values, but that's all.
        if (this.isBuiltin()) {
            var readOnly = ['acceptBagItVersion',
                            'allowFetchTxt',
                            'allowMiscTopLevelFiles',
                            'allowMiscDirectories',
                            'infoIdentifier',
                            'infoContactEmail',
                            'infoContactName',
                            'infoExternalDescription',
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
        profile.allowFetchTxt = $('#bagItProfileAllowFetchTxt').val().trim();
        profile.allowMiscTopLevelFiles = $('#bagItProfileAllowMiscTopLevelFiles').val().trim();
        profile.allowMiscDirectories = $('#bagItProfileAllowMiscDirectories').val().trim();
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
    toBagItProfileJson() {
        // Return a string of JSON in BagItProfile format,
        // with all the bad keys they use.
    }
    static fromStandardJson(jsonString) {
        // Parse JSON from BagItProfile format, with the bad
        // keys they use. Return a BagItProfile object.
        var obj = JSON.parse(jsonString)
        return BagItProfile.fromStandardObject(obj)
    }
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
                p.requiredTags.push(tagDef);
            }
        }
        return p;
    }
    save() {
        return db.bagItProfiles.set(this.id, this);
    }
    static find(id) {
        var profile = null;
        var obj = db.bagItProfiles.get(id);
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
        db.bagItProfiles.delete(this.id);
        return this;
    }
}

class BagItProfileInfo {
    constructor() {
        this.bagItProfileIdentifier = "";
        this.contactEmail = "";
        this.contactName = "";
        this.externalDescription = "";
        this.sourceOrganization = "";
        this.version = "";
    }
}

class Choice {
    constructor(value, label, selected) {
        this.value = value;
        this.label = label;
        this.selected = selected || false;
    }
    static makeList(items, selected, includeEmptyFirstOption) {
        if (!Array.isArray(selected)) {
            var selValue = selected;
            var selected = []
            selected.push(selValue)
        }
        var choices = [];
        if (includeEmptyFirstOption == true) {
            choices.push(new Choice("", ""));
        }
        for (var item of items) {
            choices.push(new Choice(item, item, Util.listContains(selected, item)));
        }
        return choices;
    }
}

class Field {
    constructor(id, name, label, value) {
        this.id = id;
        this.name = name;
        this.label = label;
        this.value = value;
        this.error = "";
        this.choices = [];
        this.cssClasses = [];
        this.attrs = {}
    }
}

class Form {
    constructor(id) {
        this.id = id;
        this.fields = {};
        this.inlineForms = [];
    }
    setErrors(errors) {
        for (var name of Object.keys(this.fields)) {
            var field = this.fields[name];
            field.error = errors[name];
        }
    }
}

class StorageService {
    constructor(name) {
        this.id = Util.uuid4();
        this.name = name;
        this.description = "";
        this.protocol = "";
        this.url = "";
        this.bucket = "";
        this.loginName = "";
        this.loginPassword = "";
        this.loginExtra = "";
    }
    validate() {
        var result = new ValidationResult();
        if (Util.isEmpty(this.id)) {
            result.errors["id"] = "Id cannot be empty";
        }
        if (Util.isEmpty(this.name)) {
            result.errors["name"] = "Name cannot be empty";
        }
        if (Util.isEmpty(this.protocol)) {
            result.errors["protocol"] = "Protocol cannot be empty";
        }
        if (Util.isEmpty(this.url)) {
            result.errors["url"] = "URL cannot be empty";
        }
        return result
    }
    toForm() {
        var form = new Form('storageServiceForm');
        form.fields['id'] = new Field('storageServiceId', 'id', 'id', this.id);
        form.fields['name'] = new Field('storageServiceName', 'name', 'Name', this.name);
        form.fields['description'] = new Field('storageServiceDescription', 'description', 'Description', this.description);
        form.fields['protocol'] = new Field('storageServiceProtocol', 'protocol', 'Protocol', this.protocol);
        form.fields['protocol'].choices = Choice.makeList(TransferProtocols, this.protocol, true);
        form.fields['url'] = new Field('storageServiceUrl', 'url', 'URL', this.url);
        form.fields['bucket'] = new Field('storageServiceBucket', 'bucket', 'Bucket or Default Folder', this.bucket);
        form.fields['loginName'] = new Field('storageServiceLoginName', 'loginName', 'Login Name', this.loginName);
        form.fields['loginName'].help = "Login name or S3 Access Key ID.";
        form.fields['loginPassword'] = new Field('storageServiceLoginPassword', 'loginPassword', 'Password or Secret Key', this.loginPassword);
        form.fields['loginPassword'].help = "Password or S3 secret access key.";
        form.fields['loginExtra'] = new Field('storageServiceLoginExtra', 'loginExtra', 'Login Extra', this.loginExtra);
        form.fields['loginExtra'].help = "Additional login info to pass to the service. Most services don't use this.";
        return form
    }
    static fromForm() {
        var name = $('#storageServiceName').val().trim();
        var service = new StorageService(name);
        service.id = $('#storageServiceId').val().trim();
        service.description = $('#storageServiceDescription').val().trim();
        service.protocol = $('#storageServiceProtocol').val().trim();
        service.url = $('#storageServiceUrl').val().trim();
        service.bucket = $('#storageServiceBucket').val().trim();
        service.loginName = $('#storageServiceLoginName').val().trim();
        service.loginPassword = $('#storageServiceLoginPassword').val().trim();
        service.loginExtra = $('#storageServiceLoginExtra').val().trim();
        return service
    }
    save() {
        return db.storageServices.set(this.id, this);
    }
    static find(id) {
        var service = null;
        var obj = db.storageServices.get(id);
        if (obj != null) {
            service = new StorageService();
            Object.assign(service, obj);
        }
        return service;
    }
    delete() {
        db.storageServices.delete(this.id);
        return this;
    }
}

class TagDefinition {
    constructor(tagFile, tagName) {
        this.id = Util.uuid4();
        this.tagFile = tagFile;
        this.tagName = tagName;
        this.required = false;
        this.emptyOk = true;
        this.values = [];
        this.defaultValue = "";
    }
    validate() {
        var result = new ValidationResult();
        if (this.values.length > 0 && !Util.listContains(this.values, this.defaultValue)) {
            result.errors['defaultValue'] = "The default value must be one of the allowed values.";
        }
        return result
    }
    toForm() {
        var form = new Form("");
        form.fields['tagFile'] = new Field('tagFile', 'tagFile', 'Tag File', this.tagFile)
        form.fields['tagName'] = new Field('tagName', 'tagName', 'Tag Name', this.tagName)
        form.fields['required'] = new Field('required', 'required', 'Presence Required?', this.required)
        form.fields['required'].choices = Choice.makeList(YesNo, this.required, false);
        form.fields['required'].help = "Does this tag have to be present in the tag file?";
        form.fields['emptyOk'] = new Field('emptyOk', 'emptyOk', 'Can tag value be empty?', this.emptyOk)
        form.fields['emptyOk'].choices = Choice.makeList(YesNo, this.emptyOk, false);
        form.fields['emptyOk'].help = "Is it valid for this tag to be present but empty?";
        form.fields['values'] = new Field('values', 'values', 'Allowed Values (one per line)', this.values.join("\n"))
        form.fields['values'].help = "List the legal values for this tag, one per line. Leave this field empty to allow any value.";
        form.fields['defaultValue'] = new Field('defaultValue', 'defaultValue', 'Default Value', this.defaultValue)
        form.fields['defaultValue'].help = "Optional default value for this field. If this tag has a list of allowed values, the default value must be one of the allowed values.";
        form.fields['tagDefinitionId'] = new Field('tagDefinitionId', 'tagDefinitionId', 'tagDefinitionId', this.id)
        return form;
    }
    static fromForm() {
        var tagName = $('#tagName').val().trim();
        var tagFile = $('#tagFile').val().trim();
        var tagDef = new TagDefinition(tagFile, tagName);
        tagDef.required = $('#required').val().trim();
        tagDef.emptyOk = $('#emptyOk').val().trim();
        tagDef.values = Util.filterEmpties($('#values').val().split("\n"));
        tagDef.defaultValue = $('#defaultValue').val().trim();
        tagDef.id = $('#tagDefinitionId').val().trim();
        return tagDef;
    }
}

class Util {
    // Thanks https://gist.github.com/kaizhu256/4482069
    static uuid4() {
        var uuid = '', ii;
        for (ii = 0; ii < 32; ii += 1) {
            switch (ii) {
            case 8:
            case 20:
                uuid += '-';
                uuid += (Math.random() * 16 | 0).toString(16);
                break;
            case 12:
                uuid += '-';
                uuid += '4';
                break;
            case 16:
                uuid += '-';
                uuid += (Math.random() * 4 | 8).toString(16);
                break;
            default:
                uuid += (Math.random() * 16 | 0).toString(16);
            }
        }
        return uuid;
    }
    static looksLikeUUID(str) {
        var match = null
        try {
            var re = /^([a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}?)$/i;
            match = str.match(re);
        } catch (ex) {
            // null string or non-string
        }
        return match != null;
    }
    static sortByName(store) {
        var list = [];
        for (var key in store) {
            list.push(store[key]);
        }
        list.sort(function(a, b) {
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        });
        return list;
    }
    static isEmpty(str) {
        return (str == null || ((typeof str) == "string" && str.trim() == ""));
    }
    static isEmptyArray(arr) {
        if(arr == null || arr.length == 0) {
            return true;
        }
        for(let str of arr) {
            if (!Util.isEmpty(str)) {
                return false;
            }
        }
        return true;
    }
    static filterEmpties(arr) {
        if(arr == null || !Array.isArray(arr)) {
            console.log(`filterEmpties: param arr is not an array. Value: ${arr}`)
            return [];
        }
        return arr.map(item => item.trim()).filter(item => item != "");
    }
    static listContains(list, item) {
        for (var i of list) {
            if (i == item || Util.boolEqual(i, item)) {
                return true;
            }
        }
        return false;
    }
    static boolEqual(a, b) {
        var aValue = Util.boolValue(a);
        var bValue = Util.boolValue(b);
        return (aValue != null && aValue == bValue);
    }
    static boolValue(str) {
        var lcString = String(str).toLowerCase();
        if (lcString == "true" || lcString == "yes") {
            return true;
        } else if (lcString == "false" || lcString == "no") {
            return false;
        }
        return null;
    }
}

class ValidationResult {
    constructor(errors) {
        this.errors = {};
    }
    isValid() {
        return Object.keys(this.errors).length == 0;
    }
}

module.exports.ActiveObject = activeObject;
module.exports.AppSetting = AppSetting;
module.exports.BagItProfile = BagItProfile;
module.exports.BagItProfileInfo = BagItProfileInfo;
module.exports.Choice = Choice;
module.exports.DB = db;
module.exports.Field = Field;
module.exports.Form = Form;
module.exports.SerializationFormats = SerializationFormats
module.exports.StorageService = StorageService;
module.exports.TagDefinition = TagDefinition;
module.exports.TransferProtocols = TransferProtocols
module.exports.Util = Util
module.exports.ValidationResult = ValidationResult
