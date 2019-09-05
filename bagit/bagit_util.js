const { BagItProfile } = require('./bagit_profile');
const { BagItProfileInfo } = require('./bagit_profile_info');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { TagDefinition } = require('./tag_definition');

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
        return BagItUtil.profileFromStandardObject(obj)
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
        p.name = obj["BagIt-Profile-Info"]["External-Description"];
        p.description = Context.y18n.__("Imported from %s", obj["BagIt-Profile-Info"]["BagIt-Profile-Identifier"]);
        p.acceptBagItVersion = obj["Accept-BagIt-Version"];
        p.acceptSerialization = obj["Accept-Serialization"];
        p.allowFetchTxt = obj["Allow-Fetch.txt"];
        p.serialization = obj["Serialization"];
        p.manifestsRequired = obj["Manifests-Required"];
        p.manifestsAllowed = obj["Manifests-Allowed"] || Constants.DIGEST_ALGORITHMS;
        p.tagManifestsRequired = obj["Tag-Manifests-Required"] || [];
        p.tagManifestsAllowed = obj["Tag-Manifests-Allowed"] || Constants.DIGEST_ALGORITHMS;
        p.tagFilesAllowed = obj["Tag-Files-Allowed"] || ["*"];

        p.bagItProfileInfo = new BagItProfileInfo();
        p.bagItProfileInfo.bagItProfileIdentifier = obj["BagIt-Profile-Info"]["BagIt-Profile-Identifier"];
        p.bagItProfileInfo.bagItProfileVersion = obj["BagIt-Profile-Info"]["BagIt-Profile-Version"];
        p.bagItProfileInfo.contactEmail = obj["BagIt-Profile-Info"]["Contact-Email"];
        p.bagItProfileInfo.contactName = obj["BagIt-Profile-Info"]["Contact-Name"];
        p.bagItProfileInfo.externalDescription = obj["BagIt-Profile-Info"]["External-Description"];
        p.bagItProfileInfo.sourceOrganization = obj["BagIt-Profile-Info"]["Source-Organization"];
        p.bagItProfileInfo.version = obj["BagIt-Profile-Info"]["Version"];

        // Copy required tag definitions to our preferred structure.
        // The BagIt profiles we're transforming don't have default
        // values for tags.
        //
        // What if there are entries other than Bag-Info?
        // See https://trello.com/c/SBLvoiwK
        for (var tagName of Object.keys(obj["Bag-Info"])) {
            var tagDef;
            var tag = obj["Bag-Info"][tagName]
            let tagsFromProfile = p.findMatchingTags("tagName", tagName).filter(t => t.tagFile = "bag-info.txt");
            if (tagsFromProfile.length > 0) {
                tagDef = tagsFromProfile[0];
            } else {
                tagDef = new TagDefinition({
                    tagFile: "bag-info.txt",
                    tagName: tagName
                });
                p.tags.push(tagDef);
            }
            tagDef.required = tag["required"] || false;
            tagDef.values = tag["values"] || [];
            tagDef.defaultValue = tag["defaultValue"] || null;
            if (Array.isArray(tag["values"]) && tag["values"].length == 1) {
                tagDef.defaultValue = tag["values"][0];
            }
        }
        return p;
    }
}

module.exports.BagItUtil = BagItUtil;
