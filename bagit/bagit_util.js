const { BagItProfile } = require('./bagit_profile');

/**
 * BagItUtil contains some static utility functions to help with BagIt profiles.
 */
class BagItUtil {

    /**
     * This function converts a standard BagIt profile, like the ones
     * described at https://github.com/bagit-profiles/bagit-profiles
     * into a DART BagIt profile.
     *
     * @see {@link profileFromStandardObject}
     * @see {@link https://github.com/bagit-profiles/bagit-profiles|Standard BagIt Profiles}
     *
     * @param {string} jsonString - The raw JSON BagIt profile to convert.
     * @returns {BagItProfile} - A DART BagItProfile object.
     */
    static profileFromStandardJson(jsonString) {
        var obj = JSON.parse(jsonString)
        return ProfileFromStandardObject(obj)
    }

    /**
     * This function converts a standard BagIt profile object, like the ones
     * described at https://github.com/bagit-profiles/bagit-profiles
     * into a DART BagIt profile.
     *
     * If you want to convert a standard profile directly from a JSON string,
     * see {@link profileFromStandardJson}.
     *
     * @see {@link profileFromStandardJson}
     * @see {@link https://github.com/bagit-profiles/bagit-profiles|Standard BagIt Profiles}
     *
     * @param {Object} obj - The BagIt profile to convert.
     * @returns {BagItProfile} - A DART BagItProfile object.
     *
     */
    static profileFromStandardObject(obj) {
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

    /**
     * Creates a new BagItProfile based on one of DART's built-in profiles,
     * which include APTrust and DPN.
     *
     * An organization may want to have more than one copy of a built-in
     * profile, each with its own default values. For example, if one person
     * or department is bagging materials for the engineering library and
     * the law library, they may want to create one profile with default
     * contact info for the law library and another with default contact info
     * for the engineering library.
     *
     * @param {string} builtinId - The id of the builtin profile to copy.
     * These ids are in the constants file.
     *
     * @param {boolean} tagAsCopy - If you set this to true, the profile
     * will be marked as a copy of a builtin object instead of as a builtin.
     * A builtin profile includes some protected fields that cannot be edited,
     * such as the list of required manifests. If you tag this new profile as
     * a copy of a builtin, users will be able to edit those normally
     * uneditable fields, and thus will be able to generate bags that do not
     * conform to the original profile. If you don't tag this as a copy,
     * users will still be able to edit the profile (e.g. by adding new tags
     * and tag files, setting default tag values, etc.), but they will not
     * be able to change core requirements (such as required manifests,
     * tag manifests, etc.).
     *
     * @returns {BagItProfile} - A new DART BagItProfile object.
     */
    static profileFromBuiltIn(builtinId, tagAsCopy) {
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

}

module.exports.BagItUtil = BagItUtil;
