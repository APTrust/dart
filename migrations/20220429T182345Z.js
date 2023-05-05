const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('../core/context');
const path = require('path');

/**
 * Migration 20220429T182345Z.js fixes the BTR BagIt profile added
 * in an earlier migration. This repaired profile includes a corrected
 * BagIt-Profile-Info section.
 *
 */
function run(name) {
    loadEmptyProfile();
    return true;
}

function loadEmptyProfile() {
    let jsonFile = path.join(__dirname, '..', 'profiles', 'btr-v0.1.json');
    Context.logger.info(`Installing corrected BTR BagIt profile from ${jsonFile}`);
    let profile = BagItProfile.load(jsonFile);
    profile.isBuiltIn = false;
    profile.userCanDelete = true;
    profile.save();
}

module.exports.run = run;
