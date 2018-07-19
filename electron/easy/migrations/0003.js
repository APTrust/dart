const { BagItProfile } = require('../core/bagit_profile');
const builtinProfiles = require('../core/builtin_profiles');
const path = require('path');
const log = require('../core/log');
const { Util } = require('../core/util');

// This is essentially the same migration as 0002.js, but we have to
// run it again to pick up the new Bag-Group-Identifier tag in the
// APTrust BagIt profile.
function run() {
    var migrationName = 'Migration_' + path.parse(__filename).name;
    var runDate = Util.getInternalVar(migrationName);
    if (runDate) {
        log.info(`Skipping migration ${migrationName}: was run on ${runDate}`);
        return;
    }
    log.info(`Running migration ${migrationName}`);

    // Overwrite the previous (unpublished) APTrust 2.2 BagItProfile
    // with the new 2.2 version that includes Bag-Group-Identifier.
    // Overwrite the old APTrust 2.1 BagItProfile with the new 2.2 version.
    var oldAPTrustProfile = BagItProfile.find(builtinProfiles.APTrustProfileId);
    var newAPTrustProfile = BagItProfile.createProfileFromBuiltIn(builtinProfiles.APTrustProfileId, false);
    newAPTrustProfile.copyDefaultTagValuesFrom(oldAPTrustProfile);
    // Save will overwrite, because this new profile has the same UUID as the old.
    newAPTrustProfile.save();

    var now = new Date().toISOString();
    log.info(`Finished ${migrationName} at ${now}`);
    Util.setInternalVar(migrationName, now);
}

module.exports.run = run;
