const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('../core/constants');

/**
 * Migration 20190130T190816Z removes the DPN BagIt profile.
 * See https://github.com/APTrust/dart/issues/224
 *
 */
function run() {
    deleteDPNProfile();
    return true;
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
