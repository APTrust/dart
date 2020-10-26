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
    return loadBuiltInProfiles();
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
    return true
}

module.exports.run = run;
