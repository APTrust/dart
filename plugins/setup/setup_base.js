const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Context } = require('../../core/context');
const fs = require('fs');
const { InternalSetting } = require('../../core/internal_setting');
const path = require('path');
const { Plugin } = require('../plugin');
const { RemoteRepository } = require('../../core/remote_repository');
const { StorageService } = require('../../core/storage_service');


const settingsFiles = {
    'app_settings.json': AppSetting,
    'bagit_profiles.json': BagItProfile,
    'internal_settings.json': InternalSetting,
    'remote_repositories.json': RemoteRepository,
    'storage_services.json': StorageService
};

const startMessageFile = "start_message.html";
const endMessageFile = "end_message.html";
const questionsFile = "questions.js";


/**
 * SetupBase is the base class for all Setup plugins. The purpose
 * of a Setup plugin is to install and configure required settings.
 *
 * A setup module will typically install a number of settings with
 * missing information. The DART SetupController will copy settings
 * from your plugin's settings directory, then it will read your
 * questions.js file, walking the user through one question at a time
 * to fill in missing attributes of the settings it just installed.
 *
 * For example, your Setup plugin may install a StorageService record
 * that already has the URL, protocol, port, and default bucket/folder
 * name filled in. The Setup questions may then ask the user for their
 * personal credentials to connect to that service.
 *
 * Your setup JSON and HTML files should be in a directory beneath
 * plugins/setup that has the same name as your setup module.
 *
 * For example, if your setup module is plugins/setup/my_setup.js, the
 * HTML and JSON files for your setup should be:
 *
 * * plugins/setup/my_setup/app_settings.json
 * * plugins/setup/my_setup/bagit_profiles.json
 * * plugins/setup/my_setup/end_message.html
 * * plugins/setup/my_setup/internal_settings.json
 * * plugins/setup/my_setup/questions.js
 * * plugins/setup/my_setup/remote_repositories.json
 * * plugins/setup/my_setup/start_message.html
 * * plugins/setup/my_setup/storage_services.json
 *
 * The Setup controller will do the following:
 *
 * 1. Display the contents of start_message.html to the user.
 * 2. Install all settings from the files app_setting.json,
 *    bagit_profiles.json, internal_settings.json, remote_repositories.json,
 *    and storage_services.json.
 * 3. Present the questions in questions.js one by one.
 * 4. Display the contents of end_message.json to the user.
 *
 * @param {string} settingsDir - The path to the directory that contains
 * the settings you want to install and/or the questions you want the
 * user to answer. Your Setup plugin should call super(__dirname) so the
 * setup module knows where to find the settings you want to install.
 *
 * @example
 *
 * class MySetup extends Setup {
 *
 *    constructor() {
 *        super(__dirname)
 *    }
 *
 *    static description() {
 *       return {
 *           id: '00000000-0000-0000-0000-000000000000',
 *           name: 'MySetup',
 *           description: Context.y18n.__('My setup module.'),
 *           version: '1.0',
 *           readsFormats: [],
 *           writesFormats: [],
 *           implementsProtocols: [],
 *           talksToRepository: [],
 *           setsUp: ['myrepo']
 *       };
 *   }
 * }
 *
 * module.exports.MySetup = MySetup;
 *
 *
 */
class SetupBase extends Plugin {
    constructor(settingsDir) {
        super();
        this.settingsDir = settingsDir;
    }

    /**
     * Returns the contents of start_message.html or end_message.html
     * as a string. Returns undefined if the file to be read from does
     * not exist.
     *
     * @param {string} which - Speficies which file to read, 'start' or
     * 'end'. Throws an exception if which is not 'start' or 'end'.
     *
     * @returns {string}
     */
    getMessage(which) {
        let pathToFile = this._getPathToMessageFile(which);
        if (fs.existsSync(pathToFile)) {
            return fs.readFileSync(pathToFile);
        }
    }

    /**
     * Returns the path to your setup module's start_message or end_message
     * HTML file.
     *
     * @param {string} which - Speficies which file to read, 'start' or
     * 'end'. Throws an exception if which is not 'start' or 'end'.
     *
     * @returns {string}
     */
    _getPathToMessageFile(which) {
        if (which == 'start') {
            return path.join(this.settingsDir, startMessageFile);
        } else if (which == 'end') {
            return path.join(this.settingsDir, endMessageFile);
        } else {
            throw new Error(Context.y18n.__("Cannot find message file %s", which));
        }
    }

    /**
     * Installs settings from the following files, ignoring any files that do
     * not exist:
     *
     * * plugins/setup/<your setup plugin>/app_settings.json
     * * plugins/setup/<your setup plugin>/bagit_profiles.json
     * * plugins/setup/<your setup plugin>/internal_settings.json
     * * plugins/setup/<your setup plugin>/questions.js
     * * plugins/setup/<your setup plugin>/remote_repositories.json
     * * plugins/setup/<your setup plugin>/storage_services.json
     *
     */
    installSettings() {
        for (let [file, objType] of Object.entries(settingsFiles)) {
            let pathToFile = path.join(this.settingsDir, file);
            if (fs.existsSync(pathToFile)) {
                Context.logger.info(Context.y18n.__(
                    "Installing settings from file %s", pathToFile));
                this._installSettingsFromFile(pathToFile, objType);
            } else {
                Context.logger.info(Context.y18n.__(
                    "Skipping file %s because it does not exist", pathToFile));
            }
        }
    }

    /**
     * Installs settings of the specified type from a single file.
     *
     * @param {string} pathToFile - Path to the JSON file containing the
     * settings you want to install.
     *
     * @param {object} objType - The class of the object to create. For
     * example, {@link AppSetting}, {@link BagItProfile}, etc.
     *
     * @private
     *
     */
    _installSettingsFromFile(pathToFile, objType) {
        let data = JSON.parse(fs.readFileSync(pathToFile));
        for (let record of data) {
            if (!objType.find(record.id)) {
                this._installObject(record, objType);
            } else {
                Context.logger.info(Context.y18n.__("Skipping installation of %s %s because it is already installed.", objType.toString(), record.name || record.id));
            }
        }
    }

    /**
     * Installs a single setting/object read from a JSON file.
     *
     * @param {object} record - A JavaScript object parsed from the JSON
     * in a settings file.
     *
     * @param {object} objType - The class of the object to create. For
     * example, {@link AppSetting}, {@link BagItProfile}, etc.
     *
     * @private
     *
     */
    _installObject(record, objType) {
        let obj;
        if (objType === BagItProfile) {
            obj = BagItProfile.inflateFrom(record);
        } else {
            let opts = this._getDefaultConstructorArgsForType(objType);
            obj = new objType(opts);
            Object.assign(obj, record);
        }
        obj.save();
        Context.logger.info(Context.y18n.__("Installed %s %s", objType.toString(), record.name || record.id));
    }

    /**
     * Returns the default/required constructor params for an object.
     * This applies to objects descended from {@link PersistentObject}.
     *
     * @param {object} objType - The class of the object. For
     * example, {@link AppSetting}, {@link BagItProfile}, etc.
     *
     * @returns {object}
     * @private
     *
     */
    _getDefaultConstructorArgsForType(objType) {
        let opts = { name: 'Unnamed Object' };
        if (objType === StorageService) {
            opts['protocol'] = 's3';
            opts['port'] = 0;
        }
        return opts;
    }

    /**
     * This parses the questions from the question.json file (if it exists)
     * and returns them as a list of {@link SetupQuestion} objects.
     *
     * @returns {Array<SetupQuestion>}
     */
    getQuestions() {
        let pathToFile = path.join(this.settingsDir, questionsFile);
        if (fs.existsSync(pathToFile)) {
            return JSON.parse(fs.readFileSync(pathToFile));
        }
    }

    /**
     * This creates or updates an {@link InternalSetting} describing when the
     * setup plugin was last run. Each time you run the setup plugin,
     * this will overwrite the timestamp.
     *
     */
    setCompletionTimestamp() {
        let className = this.constructor.name;
        let record = InternalSetting.firstMatching('name', className);
        if (!record) {
            record = new InternalSetting({ name: className });
        }
        record.value = new Date().toISOString();
        record.save();
    }

}
