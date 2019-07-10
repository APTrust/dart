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
     * This loads a BagItProfile from the test/profiles directory.
     *
     * @param {string} filename - The file name of the BagIt profile to
     * load. For example, "my_profile.json".
     *
     * @returns {BagItProfile}
     */
    static loadProfile(filename) {
        let testDir = path.join(__dirname, "..", "test");
        let profilePath = path.join(testDir, "profiles", filename);
        return BagItProfile.load(profilePath);
    }

    /**
     * This loads a BagItProfile from the builtin directory or from
     * the test/profiles directory. Throws an exception if the path does
     * not exist or cannot be read.
     *
     * @param {string} dirname - The name of the directory beneath
     * plugins/setup from which to load. For example, if dirname is
     * 'aptrust', this will load the bagit_profiles.json file from
     * plugins/setup/aptrust
     *
     * @returns {Array<BagItProfile>}
     */
    static loadProfilesFromSetup(dirname) {
        let profilePath = path.join(__dirname, "..", "plugins", "setup", dirname, "bagit_profiles.json");
        let data = JSON.parse(fs.readFileSync(profilePath));
        let profiles = [];
        for (let obj of data) {
            profiles.push(BagItProfile.inflateFrom(obj));
        }
        return profiles;
    }

    /**
     * This loads fixtures from the test/fixtures directory and optionally
     * saves them. It returns an array of the objects it loaded. To load
     * {@link BagItProfile} fixtures, see
     * {@link TestUtil.loadProfilesFromSetup}.
     *
     * @param {string|Array<string>} filenames - A string or array of strings
     * speficying which files to load. These should be the names of files
     * inside the test/fixtures directory, minus the .json file extension.
     * For example, "Job_001" or ["Job_001", "Job_002", "Job_003"].
     *
     * @param {PersistentObject|JobParams} type - The type of object to load.
     * This should be one of the following:
     *
     * * AppSetting
     * * InternalSetting
     * * Job
     * * JobParams
     * * RemoteRepository
     * * StorageService
     * * Workflow
     *
     * @param {boolean} save - If true, this saves the fixtures into the
     * DART database before returning them. Default is false.
     *
     * @returns {Array<object>}
     */
    static loadFixtures(filenames, type, save = false) {
        let types = ['AppSetting', 'InternalSetting', 'Job',
                     'JobParams', 'RemoteRepository', 'StorageService',
                     'Workflow'];
        if (typeof type.name != 'string' || !types.includes(type.name)) {
            throw new Error(Context.y18n.__("%s can only load items of these types: %s", 'loadFixtures', types.join(', ')));
        }
        let objects = [];
        let fixturePath = path.join(__dirname, "..", "test", "fixtures");
        if (!Array.isArray(filenames)) {
            filenames = [filenames];
        }
        for (let filename of filenames) {
            let fullPath = path.join(fixturePath, filename + '.json');
            let data = JSON.parse(fs.readFileSync(fullPath));
            let obj = type.inflateFrom(data);
            objects.push(obj);
            if (save && typeof obj.save == 'function') {
                obj.save();
            }
        }
        return objects;
    }
}

/**
 * This regexp matches the general ISO 8601 datetime format.
 *
 */
TestUtil.ISODatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z/;


module.exports.TestUtil = TestUtil;
