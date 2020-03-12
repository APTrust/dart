const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { InternalSetting } = require('../core/internal_setting');
const path = require('path');
const { TestUtil } = require('../core/test_util');

/**
 * Migration 20190130T190816Z removes the DPN BagIt profile.
 * See https://github.com/APTrust/dart/issues/224
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
    deleteDPNProfile();

    Context.logger.info(`Finished ${migration}`);
    let now = new Date().toISOString();
    let migrationRecord = new InternalSetting({
        name: migrationName,
        value: now,
        userCanDelete: false
    });
    migrationRecord.save();
}

function deleteDPNProfile() {
    let dpnProfileId = Constants.BUILTIN_PROFILE_IDS['dpn'];
    let dpnProfile = BagItProfile.find(dpnProfileId);
    if (dpnProfile != null) {
        dpnProfile.userCanDelete = true;
        dpnProfile.delete();
    }
}

module.exports.run = run;
