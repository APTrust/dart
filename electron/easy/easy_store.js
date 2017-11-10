const electron = require('electron')
var remote = require('electron').remote
const app = remote.app
const path = require('path')
const builtin_profiles = require(path.resolve('electron/easy/builtin_profiles'))

const TransferProtocols = ["ftp", "rsync", "s3", "sftp", "scp"];
const SerializationFormats = ["gzip", "tar", "zip"];

const Store = require('electron-store');
var db = {};
db.appSettings = new Store({name: 'app-settings'});
db.profiles = new Store({name: 'bagit-profiles'});
db.storageServices = new Store({name: 'storage-services'});


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
        this.serialization = "optional";
        // In BagItProfile format, this is a dictionary,
        // not an array. Format is
        // Key = name of tag file, Value = TagDefinition
        // The fact that key names have dots in them prevents
        // us from using nedb datastore.
        this.tagFilesRequired = [];
        this.tagManifestsRequired = [];
    }
    validate() {
        // Return ValidationResult w/ isValid and errors
    }
    toForm() {
        // Return a form object that can be passed to a template
    }
    static fromForm() {
        // Parses a form and returns an AppSetting object
    }
    toBagItProfileJson() {
        // Return a string of JSON in BagItProfile format,
        // with all the bad keys they use.
    }
    static fromBagItProfileJson(jsonString) {
        // Parse JSON from BagItProfile format, with the bad
        // keys they use. Return a BagItProfile object.
        var obj = JSON.parse(jsonString)
        return BagItProfile.fromBagItProfileObject(obj)
    }
    static fromBagItProfileObject(obj) {
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
        for (var fileName in obj["Tag-Files-Required"]) {
            for (var tagName in obj["Tag-Files-Required"][fileName]) {
                var originalDef = obj["Tag-Files-Required"][fileName][tagName];
                var tagDef = new TagDefinition(fileName, tagName);
                tagDef.required = originalDef["required"] || false;
                tagDef.emptyOk = originalDef["emptyOk"] || false;
                tagDef.values = originalDef["values"] || [];
                p.tagFilesRequired.push(tagDef);
            }
        }
        return p;
    }
    save() {
        return db.profiles.set(this.id, this);
    }
    static find(id) {
        var profile = null;
        var obj = db.profiles.get(id);
        if (obj != null) {
            profile = new BagItProfile();
            Object.assign(profile, obj);
        }
        return profile;
    }
    delete() {
        db.profiles.delete(this.id);
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
    static makeList(items, selected) {
        var choices = [];
        choices.push(new Choice("", ""));
        for (var item of items) {
            choices.push(new Choice(item, item, (item == selected)));
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
        form.fields['protocol'].choices = Choice.makeList(TransferProtocols, this.protocol);
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
        this.tagFile = tagFile;
        this.tagName = tagName;
        this.required = false;
        this.emptyOk = true;
        this.values = [];
        this.defaultValue = "";
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
    static sortStore(store) {
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
}

class ValidationResult {
    constructor(errors) {
        this.errors = {};
    }
    isValid() {
        return Object.keys(this.errors).length == 0;
    }
}

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
