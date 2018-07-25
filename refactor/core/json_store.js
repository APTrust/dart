const Conf = require('conf');

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
 * @param {string} dataDir  Path to the directory in which to store data.
 * @param {string} name     The name of the file to store data in. This will get a .json extension.
 */
class JsonStore extends Conf {
    constructor(dataDir, name) {
        var opts = {cwd: dataDir, configName: name};
        super(opts);
    }
}

module.exports.JsonStore = JsonStore;
