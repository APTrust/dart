const { Config } = require('./config');
const { JsonStore } = require('./json_store');
const logger = require('../util/logger.js');
const os = require('os');
const osLocale = require('os-locale');
const path = require('path');

const y18n = require('y18n')({
    directory: path.join(__dirname, '..', 'locales'),
    locale: osLocale.sync()
});

/**
 * GlobalContext is a single, globally available object that provides
 * information and services to all components of the application.
 */
class GlobalContext {
    /**
     * Constructs a new GlobalContext. Don't call this yourself, as it's
     * called when the module loads. You'll want to access pre-instantiated
     * Context object that this module exports.
     */
    constructor() {
        /**
          * isTestEnv indicates whether we're currently running as part of
          * a test suite. It will be true when process.env.NODE_ENV === 'test',
          * which Jest sets by default when you run `npm test`.
          *
          * @type {boolean}
          */
        this.isTestEnv = process.env.NODE_ENV === 'test';
        /**
          * config is the current configuration, either user or test, based
          * on whether isTestEnv is true.
          *
          * @type {Config}
          */
        this.config = this.isTestEnv ? Config.test : Config.user;
        /**
          * dataStores is a hash of the application data storage files.
          * The key is the object name (type of object stored in the file),
          * and the value is the queryable JsonStore object holding the data.
          *
          * @type {Object.<string, JsonStore>}
          */
        this.dataStores = {};

        /**
         * logger is an instance of the WinstonJS logger, the system-wide logging
         * facility. See https://github.com/winstonjs/winston.
         *
         * @type {Object}
         */
        this.logger = logger;

        /**
         * y18n allows us to translate/localize the UI.
         *
         * @type {Object}
         */
        this.y18n = y18n;
    }
    /**
      * Returns the JsonStore with the specified name (class name),
      * creating it first if necessary.
      *
      * @param {string} name - The name of the datastore. This can be a
      * class name, so each object type has it's own JSON data file.
     */
    db(name) {
        if (this.dataStores[name] == null) {
            this.dataStores[name] = new JsonStore(this.config.dataDir, name);
        }
        return this.dataStores[name];
    }

    /**
     * Returns true if we're running in Electron dev mode rather than
     * in compiled mode.
     *
     * @returns {boolean}
     */
    isElectronDevMode() {
        return (process.execPath.includes('node_modules/electron') ||
                process.execPath.includes('node_modules\electron'));
    }

    /**
      * Returns true or false, indicating whether or not we're
      * currently running in Electron. This will be false in jest
      * tests and when DART runs as a command-line tool.
      *
      * @returns {number}
      */
    electronIsRunning() {
        return process && process.versions && process.versions.hasOwnProperty('electron');
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
            obj = require('../package.json')
        } catch (ex) {
            this.logger.error(ex)
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
        return `${pkg.name} ${pkg.version} (Electron ${pkg.build.electronVersion} with Node.js ${process.version} for ${os.platform()}-${os.arch()}-${os.release()}.)`
    }
}

const Context = new GlobalContext();
Object.freeze(Context);

module.exports.Context = Context;
