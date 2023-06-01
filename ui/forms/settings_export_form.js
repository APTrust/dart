const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { RemoteRepository } = require('../../core/remote_repository');
const { StorageService } = require('../../core/storage_service');
const { Util } = require('../../core/util');

/**
 * SettingsExportForm allows the user to specify which settings
 * they want to export.
 */
class SettingsExportForm extends Form {

    /**
     * Creates a new form to display settings for export.
     * This is the form that lists checkboxes. Users check which
     * items they want to export.
     *
     */
    constructor(exportSettings) {
        let listOptions = {
            orderBy: 'name',
            sortDirection: 'asc'
        }
        let data = {
            appSettings: AppSetting.list(null, listOptions),
            bagItProfiles: BagItProfile.list(null, listOptions),
            remoteRepositories: RemoteRepository.list(null, listOptions),
            storageServices: StorageService.list(null, listOptions),
        }
        super('SettingsExport', exportSettings);
        this._init(data);
    }

    /**
     * Initializes the form by creating a list of items and checking
     * those that are already included in the export settings list.
     *
     * @private
     */
    _init(data) {
        for (let [key, value] of Object.entries(data)) {
            let checkedItems = this.obj.getIds(key);
            this.fields[key].choices = Choice.makeList(
                value,
                checkedItems,
                false
            );
        }
        this.fields['addQuestions'] = new Field(
            Util.uuid4(),
            "addQuestions",
            "Add questions to help users import these settings.",
            "true"
        );
    }

    /**
     * Parses the form, recirding the list of items the user wants to export.
     * Check this.obj after calling this. For example, this.obj.appSettings
     * will include all checked AppSettings.
     *
     */
    parseItemsForExport() {
        //this.parseFromDOM();
        this.obj.appSettings = this.getChecked("appSettings", AppSetting)
        this.obj.bagItProfiles = this.getChecked("bagItProfiles", BagItProfile)
        this.obj.remoteRepositories = this.getChecked("remoteRepositories", RemoteRepository)
        this.obj.storageServices = this.getChecked("storageServices", StorageService)
        return this.obj;
    }

    /**
     * Returns a list of checked items.
     *
     * @param {string} name - The name of the checkbox group to examine for
     * checked items.
     *
     * @param {object} objType - The class of object to add to the list.
     * This should be one of {@link AppSetting}, {@link BagItProfile},
     * {@link RemoteRepository} or {@link StorageService}.
     *
     * @returns {Array<PersistentObject>}
     */
    getChecked(name, objType) {
        let checked = $(`input[name="${name}"]:checked`).each(cb => $(cb).value).get().map(cb => cb.value)
        let objects = [];
        for (let id of checked) {
            objects.push(objType.find(id));
        }
        return objects;
    }

    userWantsToAddQuestions() {
        return $(`input[name="addQuestions"]`).is(':checked')
    }
}

module.exports.SettingsExportForm = SettingsExportForm;
