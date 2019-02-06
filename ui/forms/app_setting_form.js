const { AppSetting } = require('../../core/app_setting');
const { Choice } = require('./choice');
const { Field } = require('./field');
const { Form } = require('./form');

class AppSettingForm extends Form {

    constructor(appSetting) {
        super('appSettingForm', appSetting);
        this._init();
    }

    _init() {
        if (!this.obj.userCanDelete) {
            this.fields['name'].attrs['disabled'] = true;
        }
    }

}

module.exports.AppSettingForm = AppSettingForm;
