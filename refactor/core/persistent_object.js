const Conf = require('conf');

/**
 * PersistentObject is an object that can be saved to and retrieved
 * from a plain-text JSON file.
 *
 * This class uses the simple conf library from
 * https://github.com/sindresorhus/conf to store and retrieve data.
 *
 * To get system standard user data directories for the dataDir param,
 * see https://github.com/sindresorhus/env-paths
 *
 * @param {string} dataDir  Path to the directory in which to store data.
 * @param {string} name     The name of the file to store data in. This will get a .json extension.
 */
class PersistentObject {
    constructor(dataDir, name) {
        var opts = {cwd: dataDir, configName: name};
        this.db = new Conf(opts);
    }
}

module.exports.PersistentObject = PersistentObject;
