const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * TestUtil contains a number of static utility functions used in testing.
 *
 */
class TestUtil {

    /**
     * Delete the JSON files where unit tests store PersistentObjects.
     * We don't want stored data from one test to persist into the
     * next test.
     */
    static deleteJsonFile(name) {
        if (Context.isTestEnv && Context.config.dataDir.includes(path.join('.dart-test', 'data'))) {
            let jsonFile = path.join(Context.config.dataDir, `${name}.json`);
            if (fs.existsSync(jsonFile)) {
                fs.unlinkSync(jsonFile);
            }
        }
    }

    /**
     * This loads a BagItProfile from the builtin directory or from
     * the test/profiles directory.
     *
     * @param {string} filename - The file name of the BagIt profile to
     * load. For example, "my_profile.json".
     *
     * @returns {BagItProfile}
     */
    static loadProfile(filename) {
        let builtInDir = path.join(__dirname, "..", "builtin");
        let profilePath = path.join(builtInDir, filename);
        if (!fs.existsSync(profilePath)) {
            let testDir = path.join(__dirname, "..", "test");
            profilePath = path.join(testDir, "profiles", filename);

        }
        return BagItProfile.load(profilePath);
    }

}

/**
 * This regexp matches the general ISO 8601 datetime format.
 *
 */
TestUtil.ISODatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z/;


module.exports.TestUtil = TestUtil;
