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
}

module.exports.TestUtil = TestUtil;
