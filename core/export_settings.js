const { Constants } = require('./constants');
const { PersistentObject } = require('./persistent_object');

/**
 * ExportSettings represents settings to exported from DART.
 * These settings can be imported by other users. Note that
 * DART always sets the id of this object to
 * 00000000-0000-0000-0000-000000000000
 */
class ExportSettings extends PersistentObject {

    constructor(opts = {}) {
        super(opts);
        /**
         * DART keeps only one set of export settings at a time,
         * so we'll always set the id to
         * '00000000-0000-0000-0000-000000000000'
         *
         */
        this.id = Constants.EMPTY_UUID;
        /**
         * List of {@link AppSetting} objects to be exported.
         *
         */
        this.appSettings = opts.appSettings || [];
        /**
         * List of {@link BagItProfile} objects to be exported.
         *
         */
        this.bagItProfiles = opts.bagItProfiles || [];
        /**
         * List of {@link ExportQuestion} objects to present to
         * the user who is importing these settings.
         *
         */
        this.questions = opts.questions || [];
        /**
         * List of {@link RemoteRepository} objects to be exported.
         * Note that DART does not export login names or passwords.
         *
         */
        this.remoteRepositories = opts.remoteRepositories || [];
        /**
         * List of {@link StorageService} objects to be exported.
         * Note that DART does not export login names or passwords.
         *
         */
        this.storageServices = opts.storageServices || [];
    }

    /**
     * Returns a JSON representation of this object, with some sensitive
     * data filtered out.
     */
    toJson() {
        let nonEmptyQuestions = this.questions.filter((q) => q.prompt.trim() != "")
        this.questions = nonEmptyQuestions
        return JSON.stringify(this, this._jsonFilter, 2)
    }

    /**
     * Filters some security-sensitive and/or unnecessary settings from
     * JSON output. This will replace fields 'login', 'password', 'userId',
     * and 'apiToken' with empty strings unless the values begin with 'env:',
     * which indicates they are environment variables.
     *
     * @private
     */
    _jsonFilter(key, value) {
        let unsafe = ['login', 'password', 'userId', 'apiToken']
        if (unsafe.includes(key)) {
            if (!value.startsWith('env:')) {
                value = '';
            }
        }
        let exclude = ['userCanDelete', 'errors']
        if (exclude.includes(key)) {
            value = undefined;
        }
        // This is specific to DART PersistentObjects:
        // suppress serialization of the required attrs array.
        // We DO want to export required = true/false
        // on BagItProfile TagDefinition objects.
        if (key == 'required' && Array.isArray(value)) {
            value = undefined;
        }
        return value;
    }

    /**
     * Returns the ids of objects in the specified list.
     */
    getIds(listName) {
        switch (listName) {
        case "appSettings":
            return this.appSettings.map(obj => obj.id);
        case "bagItProfiles":
            return this.bagItProfiles.map(obj => obj.id);
        case "remoteRepositories":
            return this.remoteRepositories.map(obj => obj.id);
        case "storageServices":
            return this.storageServices.map(obj => obj.id);
        default:
            return [];
        }
    }

    /**
     * Returns true if anything is selected for export.
     */
    anythingSelected() {
        return (this.appSettings.length > 0 ||
                this.bagItProfiles.length > 0 ||
                this.remoteRepositories.length > 0 ||
                this.storageServices.length > 0)
    }
}

// Copy static methods from base
Object.assign(ExportSettings, PersistentObject);

module.exports.ExportSettings = ExportSettings;
