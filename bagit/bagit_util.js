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
        if (BagItUtil.guessProfileType(obj) != 'bagit_profiles') {
            throw Context.y18n.__("Object does not look like a BagIt profile");
        }
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

    /**
     * This function tries to guess the type of BagIt Profile based on
     * the keys in the profile object. Returns one of the following:
     *
     * * "bagit_profiles" - This profile is of the type described
     *   in the [bagit-profiles](https://github.com/bagit-profiles/bagit-profiles) GitHub repo.
     * * "loc_unordered" - This is an unordered Library of Congress
     *   profile, like the example at [other-project-profile.json](https://github.com/LibraryOfCongress/bagger/blob/master/bagger-business/src/main/resources/gov/loc/repository/bagger/profiles/other-project-profile.json)
     * * "loc_ordered" - An ordered Library of Congress profile, like the
     *   [SANC State Profile](https://github.com/LibraryOfCongress/bagger/blob/master/bagger-business/src/main/resources/gov/loc/repository/bagger/profiles/SANC-state-profile.json)
     * * "dart" - A DART BagIt profile, like the [APTrust BagIt Profile](https://github.com/APTrust/dart/blob/master/plugins/setup/aptrust/bagit_profiles.json)
     * * "unknown" - Cannot identify profile type.
     *
     * The great thing about standards is that there are so many of them.
     *
     * @param {object}
     * @returns {string}
     *
     */
    static guessProfileType(obj) {
        let type = 'unknown';
        if (Array.isArray(obj['tags'])) {
            type = 'dart';
        } else if (Array.isArray(obj['ordered'])) {
            type = 'loc_ordered';
        } else if (typeof obj['Bag-Info'] == 'object') {
            type = 'bagit_profiles'
        } else {
            let everythingLooksLikeATag = true;
            for (let item of Object.values(obj)) {
                // Tags have at least one of these properties.
                if (item['fieldRequired'] === undefined && item['requiredValue'] === undefined) {
                    everythingLooksLikeATag = false;
                    break;
                }
            }
            if (everythingLooksLikeATag) {
                type = 'loc_unordered'
            }
        }
        return type;
    }

    /**
     * Converts an ordered Library of Congress BagIt profile like the
     * [SANC-state-profile.json](https://raw.githubusercontent.com/LibraryOfCongress/bagger/master/bagger-business/src/main/resources/gov/loc/repository/bagger/profiles/SANC-state-profile.json)
     * profile to a DART BagIt profile.
     *
     * @param {object}
     * @returns {BagItProfile}
     */
    static profileFromLOCOrdered(obj) {
        if (BagItUtil.guessProfileType(obj) != 'loc_ordered') {
            throw Context.y18n.__("Object does not look like an ordered Library of Congress BagIt profile");
        }
        var now = new Date();
        var dartProfile = new BagItProfile();
        dartProfile.name = Context.y18n.__("Imported Profile %s", now.toISOString());
        dartProfile.description = dartProfile.name;
        for (let item of obj['ordered']) {
            let tagName = Object.keys(item)[0];
            let tagObj = Object.values(item)[0];
            BagItUtil.convertLOCTag(dartProfile, tagName, tagObj);
        }
        return dartProfile;
    }

    /**
     * Converts an unordered Library of Congress BagIt profile like the
     * [other-project-profile.json](https://raw.githubusercontent.com/LibraryOfCongress/bagger/master/bagger-business/src/main/resources/gov/loc/repository/bagger/profiles/other-project-profile.json)
     * profile to a DART BagIt profile.
     *
     * @param {object}
     * @returns {BagItProfile}
     */
    static profileFromLOC(obj) {
        if (BagItUtil.guessProfileType(obj) != 'loc_unordered') {
            throw Context.y18n.__("Object does not look like an unordered Library of Congress BagIt profile");
        }
        var now = new Date();
        var dartProfile = new BagItProfile();
        dartProfile.name = Context.y18n.__("Imported Profile %s", now.toISOString());
        dartProfile.description = dartProfile.name;
        for (let [tagName, tagObj] of Object.entries(obj)) {
            BagItUtil.convertLOCTag(dartProfile, tagName, tagObj);
        }
        return dartProfile;
    }

    static convertLOCTag(dartProfile, tagName, locTag) {
        let tagDef;
        let tagsFromProfile = dartProfile.findMatchingTags("tagName", tagName).filter(t => t.tagFile = "bag-info.txt");
        if (tagsFromProfile.length > 0) {
            tagDef = tagsFromProfile[0];
        } else {
            tagDef = new TagDefinition({
                tagFile: "bag-info.txt",
                tagName: tagName
            });
            dartProfile.tags.push(tagDef);
        }
        tagDef.required = locTag["fieldRequired"] || false;
        tagDef.values = locTag["valueList"] || [];
        tagDef.defaultValue = locTag["defaultValue"] || null;
        if (locTag["requiredValue"]) {
            tagDef.required = true;
            tagDef.values = [locTag["requiredValue"]];
            tagDef.defaultValue = locTag["requiredValue"];
        }
    }

    /**
     * This function converts a DART BagItProfile object to the format
     * described at https://github.com/bagit-profiles/bagit-profiles.
     *
     * Note that a considerable amount of tag-related information
     * will be lost in the conversion, since the GitHub BagIt profiles
     * do not support as rich a set of information as DART profiles.
     *
     * @see {@link https://github.com/bagit-profiles/bagit-profiles|Standard BagIt Profiles}
     *
     * @param {BagItProfile} - A DART BagItProfile object.
     * @returns {Object} - A converted BagIt profile.
     *
     */
    static profileToStandardObject(p) {
        var obj = {};
        obj["Accept-BagIt-Version"] = p.acceptBagItVersion;
        obj["Accept-Serialization"] = p.acceptSerialization;
        obj["Allow-Fetch.txt"] = p.allowFetchTxt;
        obj["Serialization"] = p.serialization;
        obj["Manifests-Required"] = p.manifestsRequired;
        obj["Tag-Manifests-Required"] = p.tagManifestsRequired;

        // The following two are not yet supported in BagIt Profiles v1.2.0
        // spec. We have an open pull request to include them.
        //
        //obj["Manifests-Allowed"] = p.manifestsAllowed;
        //obj["Tag-Manifests-Allowed"] = p.tagManifestsAllowed;

        obj["Tag-Files-Allowed"] = p.tagFilesAllowed;

        obj["BagIt-Profile-Info"] = {};
        obj["BagIt-Profile-Info"]["BagIt-Profile-Identifier"] = p.bagItProfileInfo.bagItProfileIdentifier;
        obj["BagIt-Profile-Info"]["BagIt-Profile-Version"] = p.bagItProfileInfo.bagItProfileVersion;
        obj["BagIt-Profile-Info"]["Contact-Email"] = p.bagItProfileInfo.contactEmail;
        obj["BagIt-Profile-Info"]["Contact-Name"] = p.bagItProfileInfo.contactName;
        obj["BagIt-Profile-Info"]["External-Description"] = p.bagItProfileInfo.externalDescription;
        obj["BagIt-Profile-Info"]["Source-Organization"] = p.bagItProfileInfo.sourceOrganization;
        obj["BagIt-Profile-Info"]["Version"] = p.bagItProfileInfo.version;

        // Add values to one tag in this profile, so we can test...
        p.firstMatchingTag("tagName", "Bagging-Software").values = [
            "DART",
            "TRAD"
        ];

        // Tags
        obj["Bag-Info"] = {};
        obj["Tag-Files-Required"] = [];
        for (let tagDef of p.tags) {
            if (tagDef.tagFile == "bagit.txt") {
                continue;
            }
            if (tagDef.tagFile == "bag-info.txt") {
                obj["Bag-Info"][tagDef.tagName] = {};
                obj["Bag-Info"][tagDef.tagName]["required"] = tagDef.required;
                if (Array.isArray(tagDef.values) && tagDef.values.length) {
                    obj["Bag-Info"][tagDef.tagName]["values"] = tagDef.values;
                }
            } else {
                // We can't specify tag info outside of bag-info.txt,
                // but if we find a required tag in another file,
                // we can assume that tag file is required.
                if (tagDef.required === true && !obj["Tag-Files-Required"].includes(tagDef.tagFile)) {
                    obj["Tag-Files-Required"].push(tagDef.tagFile);
                }
            }
        }
        return obj;
    }

    /**
     * This function converts a DART BagItProfile object to a JSON string
     * in the format described at
     * https://github.com/bagit-profiles/bagit-profiles.
     *
     * Note that a considerable amount of tag-related information
     * will be lost in the conversion, since the GitHub BagIt profiles
     * do not support as rich a set of information as DART profiles.
     *
     * @see {@link https://github.com/bagit-profiles/bagit-profiles|Standard BagIt Profiles}
     *
     * @param {BagItProfile} - A DART BagItProfile object.
     * @returns {string}
     *
     */
    static profileToStandardJson(profile) {
        return JSON.stringify(BagItUtil.profileToStandardObject(profile), null, 2);
    }

}

module.exports.BagItUtil = BagItUtil;
