const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { InternalSetting } = require('../core/internal_setting');
const path = require('path');
const { TestUtil } = require('../core/test_util');

/**
 * Migration 20200227T120404Z.js adds an empty BagIt profile.
 *
 */
function run() {
    let migration = path.parse(__filename).name;
    let migrationName = `Migration_${migration}`;
    let record = InternalSetting.firstMatching('name', migrationName);
    if (record && record.value) {
        return;
    }
    Context.logger.info(`Starting migration ${migration}`);

    // This is the meat of the work...
    loadEmptyProfile();

    Context.logger.info(`Finished ${migration}`);
    let now = new Date().toISOString();
    let migrationRecord = new InternalSetting({
        name: migrationName,
        value: now,
        userCanDelete: false
    });
    migrationRecord.save();
}

function loadEmptyProfile() {
    let profile = BagItProfile.find(Constants.BUILTIN_PROFILE_IDS['empty'])
    if (!profile) {
        let jsonFile = path.join(__dirname, '..', 'profiles', 'empty_profile.json');
        Context.logger.info(`Installing 'Empty Profile' from ${jsonFile}`);
        profile = BagItProfile.load(jsonFile);
        profile.isBuiltIn = true;
        profile.userCanDelete = false;
        profile.save();
    } else {
        Context.logger.info(`'Empty Profile' is already installed`);
    }
}

module.exports.run = run;
