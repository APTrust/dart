const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { InternalSetting } = require('../core/internal_setting');
const path = require('path');
const { TestUtil } = require('../core/test_util');

/**
 * Migration 20190130T190816Z adds the built-in BagIt profile for APTrust
 * to the user's local BagItProfile database.
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
    let profile = BagItProfile.find(Constants.BUILTIN_PROFILE_IDS['aptrust'])
    if (!profile) {
        let jsonFile = path.join(__dirname, '..', 'profiles', 'aptrust_2.2.json');
        Context.logger.info(`Installing profile ${name} from ${jsonFile}`);
        profile = BagItProfile.load(jsonFile);
        profile.isBuiltIn = true;
        profile.userCanDelete = false;
        profile.save();
    } else {
        Context.logger.info(`APTrust BagIt profile is already installed`);
    }
}

module.exports.run = run;
