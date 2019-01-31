const { AppSetting } = require('../../core/app_setting');
const { Choice } = require('../common/choice');
const { Field } = require('../common/field');
const { Form } = require('../common/form');

class AppSettingForm {

    static create(appSetting) {
        var form = new Form('appSettingForm', appSetting);

        // Customize
        if (!appSetting.userCanDelete) {
            form.fields['name'].attrs['disabled'] = true;
        }
        form.fields['name'].attrs['required'] = true;
        return form
    }

}

module.exports.AppSettingForm = AppSettingForm;
