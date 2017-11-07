class BagItProfile {
    constructor() {
        // name and description are not part of BagItProfile standard
        this.name = name;
        this.description = description;
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
    static fromBagItProfileJson() {
        // Parse JSON from BagItProfile format, with the bad
        // keys they use. Return a BagItProfile object.
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

module.exports.BagItProfile = BagItProfile;
module.exports.BagItProfileInfo = BagItProfileInfo;
module.exports.TagDefinition = TagDefinition;
