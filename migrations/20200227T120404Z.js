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
    return loadEmptyProfile();
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
    return true
}

module.exports.run = run;
