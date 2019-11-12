const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { InternalSetting } = require('../core/internal_setting');
const os = require('os');
const path = require('path');

const aptrustProfileId = Constants.BUILTIN_PROFILE_IDS["aptrust"];

/**
 * Migration 20190523194657Z updates the APTrust BagIt profile
 * to include manifestsAllowed and tagManifestsAllowed.
 *
 */
function run() {
    let migration = path.parse(__filename).name;
    let migrationName = `Migration_${migration}`;
    let record = InternalSetting.firstMatching('name', migrationName);
    if (record && record.value) {
        //Context.logger.info(`Skipping migration ${migrationName}: was run on ${record.value}`);
        return;
    }
    Context.logger.info(`Starting migration ${migration}`);

    let succeeded = updateAPTrustBagItProfiles();

    if (succeeded) {
        Context.logger.info(`Finished ${migration}`);
        let now = new Date().toISOString();
        let migrationRecord = new InternalSetting({
            name: migrationName,
            value: now,
            userCanDelete: false
        });
        migrationRecord.save();
    } else {
        Context.logger.warn(`Migration ${migration} failed`);
    }
}

function updateAPTrustBagItProfiles() {
    let profile = BagItProfile.find(aptrustProfileId);
    let succeeded = true;
    if (profile) {
        if (!updateProfile(profile)) {
            succeeded = false;
        }
    } else {
        Context.logger.warn(`Could not find builtin APTrust BagIt profile.`);
    }

    let derivedProfiles = BagItProfile.findMatching("baseProfileId", aptrustProfileId) || [];
    derivedProfiles = derivedProfiles.map(p => BagItProfile.inflateFrom(p));
    for (let derivedProfile of derivedProfiles) {
        if (!updateProfile(derivedProfile)) {
            succeeded = false;
        }
    }
    return succeeded;
}

function updateProfile(profile) {
    try {
        profile.manifestsRequired = ["md5"];
        profile.tagManifestsRequired = [];
        profile.manifestsAllowed = ["md5", "sha256"];
        profile.tagManifestsAllowed = ["md5", "sha256"]
        profile.save();
        Context.logger.info(`Updated profile ${profile.name}`);
    } catch (ex) {
        Context.logger.error(ex);
        return false;
    }
    return true;
}

module.exports.run = run;
