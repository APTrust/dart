const { Config } = require('./config');
const fs = require('fs');
const { JsonStore } = require('./json_store');
const logger = require('../util/logger.js');
const os = require('os');
const osLocale = require('os-locale');
const path = require('path');
const { fstat } = require('fs');

const y18n = require('y18n')({
    directory: path.join(__dirname, '..', 'locales'),
    locale: getLocale(),
    fallbackToLanguage: true,
    updateFiles: false,
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
          * isDevEnv indicates whether we're currently running in a development
          * environment. For this to work, the package.json file needs the
          * following entry in "scripts":
          *
          * @example
          * "scripts": {
          *     ...
          *     "start": "NODE_ENV=dev electron .",
          *     ...
          * }
          *
          *
          * @type {boolean}
          */
        this.isDevEnv = process.env.NODE_ENV === 'dev';
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

        /**
         * This object contains info about child processes spawned by the
         * current DART process. While the persistent {@link DartProcess}
         * object stores info in a local DB about all child processes DART
         * has spawned, this hash includes information about running
         * child processes only.
         *
         * This objects keys are UUIDs. Each key is the UUID of a
         * {@link DartProcess} object. The values are live Node.js Process
         * objects. If a DartProcess.id key is not in the hash of
         * childProcesses, it is not currently running.
         */
        this.childProcesses = {};

        /**
         * Force the bagger and the validator to elay this many milliseconds
         * between operations. This slows down the bagging and validation
         * processes. We use this only for UI testing during development.
         * In production, this should always be set to zero.
         *
         * @type {number}
         */
        this.slowMotionDelay = 0;
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
            obj = require('../package.json');
        } catch (ex) {
            this.logger.error(ex)
        }
        return obj;
    }

    /**
     * Returns the full version of DART, including which Node version
     * DART is using and the OS platform, architecture, and release
     * number.
     *
     * @returns {string}
     */
    dartVersion() {
        var pkg = this.getPackageInfo();
        if (pkg == null) {
            return "Cannot read version from package.json file.";
        }
        return `${pkg.name} ${pkg.version} with Node.js ${process.version} for ${os.platform()}-${os.arch()}-${os.release()}.`;
    }

    /**
     * Returns the release number of this DART build. For example,
     * "2.0.16". If you need more complete information, use
     * {@link GlobalContext#dartVersion}.
     *
     * @returns {string}
     */
    dartReleaseNumber() {
        var pkg = this.getPackageInfo();
        if (pkg == null) {
            return "0.0.0";
        }
        return pkg.version;
    }
}

/**
 * getLocale returns the user's current locale, or "en-US" if DART has
 * no matching file for the user's actual locale.
 * 
 * This fixes bug https:* github.com/APTrust/dart/issues/516
 * 
 * This is actually a bug in y18n, which does not correctly fall back
 * to language-only files. Creating file locales/en.json should cause
 * any English locale to fall back to en.json if it doesn't have a specific
 * territory file like en-IE or en-GB. However, in testing, fallback never
 * works. Note that the os-locale package normalizes all locales to use
 * dashes instead of underscores. So if system says locale is en_NZ, os-locale
 * reports en-NZ. 
 * 
 * Anyhoo, since resetting the locale using y18n.setLocale()
 * does not load the specified locale file as expected, we have to 
 * set this right from the get-go.
 * 
 * When DART gets non-English translation files, we'll have to revisit this.
 * 
 * @returns {string}
 */
function getLocale() {
    let locale = osLocale.sync()
    let localeFile = path.join(__dirname, '..', 'locales', locale + ".json")
    if (!fs.existsSync(localeFile)) {
        return "en-US"
    }
    return locale
}

const Context = new GlobalContext();
Object.freeze(Context);

module.exports.Context = Context;
