const { BagItProfile } = require('../core/bagit_profile');
const builtinProfiles = require('../core/builtin_profiles');
const path = require('path');
const log = require('../core/log');
const { Util } = require('../core/util');

// This is the only function we need to export. It will be called
// every time the application starts. This function records the
// fact that it has been run in an internal variable. A migration
// should always check that variable so that it does not run again.
function run() {
    var migrationName = 'Migration_' + path.parse(__filename).name;
    var runDate = Util.getInternalVar(migrationName);
    if (runDate) {
        log.info(`Skipping migration ${migrationName}: was run on ${runDate}`);
        return;
    }
    log.info(`Running migration ${migrationName}`);

    // Overwrite the old APTrust 2.1 BagItProfile with the new 2.2 version.
    oldAPTrustProfile = BagItProfile.find(builtinProfiles.APTrustProfileId)
    oldAPTrustProfile.delete()
    BagItProfile.createProfileFromBuiltIn(builtinProfiles.APTrustProfileId);

    var now = new Date().toISOString();
    log.info(`Finished ${migrationName} at ${now}`);
    Util.setInternalVar(migrationName, now);
}

module.exports.run = run;
