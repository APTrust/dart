function profileFromStandardJson(jsonString) {
    // Parse JSON from BagItProfile format, with the bad
    // keys they use. Return a BagItProfile object.
    var obj = JSON.parse(jsonString)
    return ProfileFromStandardObject(obj)
}

// Used in early versions of DART, and may be used later
// to import other profiles. This function converts standard
// BagIt Profiles to our format.
function profileFromStandardObject(obj) {
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

function profileFromBuiltIn(builtinId, tagAsCopy) {
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
