const { AppSetting } = require('../../core/app_setting');
const { AppSettingForm } = require('../forms/app_setting_form');
const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class AppSettingController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
    }

    create() {
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
        form.parseFromDom();
        console.log(form);
        if (!form.obj.validate()) {
            form.setErrors();
            let html = Templates.appSettingForm({ form: form });
            return this.containerContent(html);
        }
        appSetting.save();
        return this.list();
    }

    list() {
        let items = AppSetting.list();
        let data = { items: items };
        let html = Templates.appSettingList(data);
        return this.containerContent(html);
    }

    destroy() {
        return 'Destroy AppSetting';
    }
}

module.exports.AppSettingController = AppSettingController;
