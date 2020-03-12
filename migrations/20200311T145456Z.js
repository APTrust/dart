const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { InternalSetting } = require('../core/internal_setting');
const path = require('path');
const { TestUtil } = require('../core/test_util');

/**
 * Migration 20200311T145456Z.js fixes the empty BagIt profile added
 * in an earlier migration. This repaired empty profile:
 *
 * 1. does not require any specific manifest algorithm
 * 2. does not require serialization
 * 3. permits additional serialization formats
 * 4. allows fetch.txt
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
    let jsonFile = path.join(__dirname, '..', 'profiles', 'empty_profile.json');
    Context.logger.info(`Installing 'Empty Profile' from ${jsonFile}`);
    let profile = BagItProfile.load(jsonFile);
    profile.isBuiltIn = true;
    profile.userCanDelete = false;
    profile.save();
}

module.exports.run = run;
