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

    constructor() {
        let listOptions = {
            orderBy: 'name',
            sortDirection: 'asc'
        }
        let filterFn = function(ss) { return ss.allowsUpload };
        let data = {
            appSettings: AppSetting.list(null, listOptions),
            bagItProfiles: BagItProfile.list(null, listOptions),
            questions: [],
            remoteRepositories: RemoteRepository.list(null, listOptions),
            storageServices: StorageService.list(null, listOptions),
        }
        super('SettingsExport', data);
        this._init(data);
    }

    _init(data) {
        for (let [key, value] of Object.entries(data)) {
            // errors key is added in Form base constructor
            if (key != 'errors' && key != 'questions') {
                this.fields[key].choices = Choice.makeList(
                    value,
                    [],
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

    getSelectedItems() {
        //this.parseFromDOM();
        return {
            appSettings: this.getChecked("appSettings", AppSetting),
            bagItProfiles: this.getChecked("bagItProfiles", BagItProfile),
            remoteRepositories: this.getChecked("remoteRepositories", RemoteRepository),
            storageServices: this.getChecked("storageServices", StorageService)
        }
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
