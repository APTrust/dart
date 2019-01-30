const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { InternalSetting } = require('../core/internal_setting');
const path = require('path');
const { TestUtil } = require('../core/test_util');

/**
 * Migration 20190130T190816Z adds the built-in BagIt profiles for APTrust
 * and DPN to the user's local BagItProfile database.
 *
 */
function run() {
    let migration = path.parse(__filename).name;
    let migrationName = `Migration_${migration}`;
    let record = InternalSetting.firstMatching('name', migrationName);
    if (record && record.value) {
        Context.logger.info(`Skipping migration ${migrationName}: was run on ${record.value}`);
        return;
    }
    Context.logger.info(`Starting migration ${migration}`);

    // This is the meat of the work...
    loadBuiltInProfiles();

    Context.logger.info(`Finished ${migration}`);
    let now = new Date().toISOString();
    let migrationRecord = new InternalSetting({
        name: migrationName,
        value: now,
        userCanDelete: false
    });
    migrationRecord.save();
}

/**
 * Load APTrust and DPN profiles in the local BagItProfile database
 * if they are not already there.
 *
 */
function loadBuiltInProfiles() {
    let profiles = {
        'APTrust': BagItProfile.find(Constants.BUILTIN_PROFILE_IDS['aptrust']),
        'DPN': BagItProfile.find(Constants.BUILTIN_PROFILE_IDS['dpn'])
    };
    let jsonFiles = {
        'APTrust': 'aptrust_bagit_profile_2.2.json',
        'DPN': 'dpn_bagit_profile_2.1.json'
    }
    for (let [name, profile] of Object.entries(profiles)) {
        if (!profile) {
            let jsonFile = jsonFiles[name];
            Context.logger.info(`Installing profile ${name} from ${jsonFile}`);
            profile = TestUtil.loadProfile(jsonFile);
            profile.isBuiltIn = true;
            profile.userCanDelete = false;
            profile.save();
        } else {
            Context.logger.info(`Profile ${name} is already installed`);
        }
    }
}

module.exports.run = run;
