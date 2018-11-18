const Conf = require('conf');
const fs = require('fs');
const makeDir = require('make-dir');
const path = require('path');
const writeFileAtomic = require('write-file-atomic');

/**
 * JsonStore allows us to save, update, retrieve, and delete objects
 * from a plain-text JSON file.
 *
 * This class extends the simple conf library from
 * https://github.com/sindresorhus/conf and exposes its methods.
 *
 * To get system standard user data directories for the dataDir param,
 * see https://github.com/sindresorhus/env-paths
 *
 */
class JsonStore extends Conf {
    /**
     * Creates a new JsonStore
     *
     * @param {string} dataDir  Path to the directory in which to store data.
     * @param {string} name     The name of the file to store data in. This should
     * match the class name of the type of object you're storing. The file name
     * will have a .json extension appended automatically.
     */
    constructor(dataDir, name) {
        var opts = {cwd: dataDir, configName: name};
        super(opts);

        // Make sure underlying data file exists. This was the behavior of
        // earlier versions of the conf library, and some of our tests
        // want to know the files are there.
        if (!fs.existsSync(this.path)) {
            makeDir.sync(path.dirname(this.path));
            writeFileAtomic.sync(this.path, '[]');
        }
    }
}

module.exports.JsonStore = JsonStore;
