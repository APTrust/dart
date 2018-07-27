const { Config } = require('./config');
const { JsonStore } = require('./json_store');

/**
 * GlobalContext is a single, globally available object that provides
 * information and services to all components of the application.
 */
class GlobalContext {
    constructor() {
        // When you run `npm test`, this env var is set by jest.
        this.isTestEnv = process.env.NODE_ENV === 'test';
        this.config = this.isTestEnv ? Config.test : Config.user;
        this.dataStores = {};
    }
    /**
      * Returns the JsonStore with the specified name (class name),
      * creating it first if necessary.
      *
      * @param {string} name - The name of the datastore. This can be a class name,
      * so each object type has it's own JSON data file.
     */
    db(name) {
        if (this.dataStores[name] == null) {
            this.dataStores[name] = new JsonStore(this.config.dataDir, name);
        }
        return this.dataStores[name];
    }

    /**
     * Returns true if we're running in Electron dev mode rather than in compiled mode.
     *
     * @returns {boolean}
     */
    isElectronDevMode() {
        return (process.execPath.includes('node_modules/electron') ||
                process.execPath.includes('node_modules\electron'));
    }


    /**
     * Returns a JavaScript object built from parsing this application's
     * package.json file.
     *
     * @returns {Object}
     */
    getPackageInfo() {
        var obj = null;
        try {
            obj = require('../../package.json')
        } catch (ex) {
            // TODO: Write to application log.
            console.error(ex)
        }
        return obj;
    }
    /**
     * Returns the version of DART.
     *
     * @returns {string}
     */
    dartVersion() {
        var pkg = this.getPackageInfo();
        if (pkg == null) {
            return "Cannot read version from package.json file.";
        }
        return `${pkg.name} ${pkg.version} (Electron ${pkg.build.electronVersion} for ${os.platform()})`
    }

}

const Context = new GlobalContext();
Object.freeze(Context);

module.exports.Context = Context;
