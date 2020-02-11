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
 * SettingsExportForm allows the user to specify where Job
 * files will be uploaded.
 */
class SettingsExportForm extends Form {

    constructor(exportSettings) {
        let listOptions = {
            orderBy: 'name',
            sortDirection: 'asc'
        }
        let data = {
            appSettings: AppSetting.list(null, listOptions),
            bagItProfiles: BagItProfile.list(null, listOptions),
            questions: [],
            remoteRepositories: RemoteRepository.list(null, listOptions),
            storageServices: StorageService.list(null, listOptions),
        }
        super('SettingsExport', exportSettings);
        this._init(data);
    }

    _init(data) {
        for (let [key, value] of Object.entries(data)) {
            // errors key is added in Form base constructor
            let checkedItems = this.obj.getIds(key);
            if (key != 'errors' && key != 'questions') {
                this.fields[key].choices = Choice.makeList(
                    value,
                    checkedItems,
                    false
                );
            }
        }
        this.fields['addQuestions'] = new Field(
            Util.uuid4(),
            "addQuestions",
            "Add questions to help users import these settings.",
            "true"
        );
    }

    parseItemsForExport() {
        //this.parseFromDOM();
        this.obj.appSettings = this.getChecked("appSettings", AppSetting)
        this.obj.bagItProfiles = this.getChecked("bagItProfiles", BagItProfile)
        this.obj.remoteRepositories = this.getChecked("remoteRepositories", RemoteRepository)
        this.obj.storageServices = this.getChecked("storageServices", StorageService)
        return this.obj;
    }

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
