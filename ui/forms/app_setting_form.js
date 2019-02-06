const { AppSetting } = require('../../core/app_setting');
const { Choice } = require('./choice');
const { Field } = require('./field');
const { Form } = require('./form');

class AppSettingForm {

    static create(appSetting) {
        var form = new Form('appSettingForm', appSetting);

        // Customize
        if (!appSetting.userCanDelete) {
            form.fields['name'].attrs['disabled'] = true;
        }
        return form
    }

}

module.exports.AppSettingForm = AppSettingForm;
