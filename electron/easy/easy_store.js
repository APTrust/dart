const electron = require('electron')
var remote = require('electron').remote
const app = remote.app
const path = require('path')
const builtin_profiles = require(path.resolve('electron/easy/builtin_profiles'))

const TransferProtocols = ["ftp", "rsync", "s3", "sftp", "scp"];
const SerializationFormats = ["gzip", "tar", "zip"];

const Store = require('electron-store');
var db = new Store({name: 'easy-store-data'});


class AppSetting {
    constructor(name, value) {
        this.id = Util.uuid4();
        this.name = name;
        this.value = value;
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
    save() {
        db.set(this.id, this);
        return this;
    }
    static find(id) {
        var setting = null;
        var obj = db.get(id);
        if (obj != null) {
            setting = new AppSetting();
            Object.assign(setting, obj);
        }
        return setting;
    }
    delete() {
        db.delete(this.id);
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
        db.set(this.id, this);
        return this;
    }
    static find(id) {
        var profile = null;
        var obj = db.get(id);
        if (obj != null) {
            profile = new BagItProfile();
            Object.assign(profile, obj);
        }
        return profile;
    }
    delete() {
        db.delete(this.id);
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
    constructor(value, label) {
        this.value = value;
        this.label = label;
        this.selected = false;
    }
    static makeList(items, selected) {
        // return a list of choices
    }
}

class Field {
    constructor(id, name, label, value) {
        this.name = name;
        this.label = label;
        this.value = value;
        this.choices = [];
        this.attrs = {}
    }
}

class Form {
    constructor() {
        this.field = [];
    }
    validate() {
        // Convert the form to the underlying object,
        // validate that, then set the errors here.
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
        // Return ValidationResult w/ isValid and errors
    }
    toForm() {
        // Return a form object that can be passed to a template
    }
    static fromForm() {
        // Parses a form and returns an AppSetting object
    }
    save() {
        db.set(this.id, this);
        return this;
    }
    static find(id) {
        var service = null;
        var obj = db.get(id);
        if (obj != null) {
            service = new StorageService();
            Object.assign(service, obj);
        }
        return service;
    }
    delete() {
        db.delete(this.id);
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
    };
}

class ValidationResult {
    constructor(isValid, errors) {
        this.isValid = isValid;
        this.errors = errors || [];
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
