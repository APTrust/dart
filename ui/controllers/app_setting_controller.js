const { AppSetting } = require('../../core/app_setting');
const { AppSettingForm } = require('../forms/app_setting_form');
const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

// Define a type map for any URLSearchParams we may receive.
// Params are strings by default, so we only have to define
// types that need to be converted.
const typeMap = {
    userCanDelete: 'boolean',  // part of AppSetting
    limit: 'number',           // used in list params
    offset: 'number',          // used in list params
}

class AppSettingController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.typeMap = typeMap;
    }

    new() {
        let form = AppSettingForm.create(new AppSetting());
        let html = Templates.appSettingForm({ form: form });
        return this.containerContent(html);
    }

    edit() {
        let appSetting = AppSetting.find(this.params.get('id'));
        let form = AppSettingForm.create(appSetting);
        let html = Templates.appSettingForm({ form: form });
        return this.containerContent(html);
    }

    update() {
        let appSetting = AppSetting.find(this.params.get('id')) || new AppSetting();
        let form = AppSettingForm.create(appSetting);
        form.parseFromDOM();
        if (!form.obj.validate()) {
            form.setErrors();
            let html = Templates.appSettingForm({ form: form });
            return this.containerContent(html);
        }
        this.alertMessage = `Saved application setting "${form.obj.name}"`;
        appSetting.save();
        return this.list();
    }

    list() {
        let listParams = this.paramsToHash();
        let items = AppSetting.list(null, listParams);
        let data = {
            alertMessage: this.alertMessage,
            items: items
        };
        let html = Templates.appSettingList(data);
        return this.containerContent(html);
    }

    destroy() {
        let appSetting = AppSetting.find(this.params.get('id'));
        if (confirm(`Delete application setting "${appSetting.name}"?`)) {
            this.alertMessage = `Deleted application setting "${appSetting.name}"`;
            appSetting.delete();
            return this.list();
        }
        return this.noContent();
    }
}

module.exports.AppSettingController = AppSettingController;
