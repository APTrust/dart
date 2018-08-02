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
    }
}

module.exports.JsonStore = JsonStore;
