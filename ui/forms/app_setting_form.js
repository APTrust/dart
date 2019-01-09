const { AppSetting } = require('../../core/app_setting');
const { Choice } = require('../common/choice');
const { Field } = require('../common/field');
const { Form } = require('../common/form');

class AppSettingForm {
    static create(appSetting) {
        var form = new Form('appSettingForm');
        form.fields['id'] = new Field('appSettingId', 'id', 'id', appSetting.id);
        form.fields['name'] = new Field('appSettingName', 'name', 'Name', appSetting.name);
        if (!appSetting.userCanDelete) {
            form.fields['name'].attrs['disabled'] = true;
        }
        form.fields['name'].help = appSetting.help;
        form.fields['value'] = new Field('appSettingValue', 'value', 'Value', appSetting.value);
        form.fields['userCanDelete'] = new Field('userCanDelete', 'userCanDelete', 'User Can Delete', appSetting.userCanDelete);

        // ----------------------------------------------------
        // TODO: Enable this later, when plugins are available.
        // ----------------------------------------------------
        // if (appSetting.name == "Remote Repository") {
        //     form.fields['value'].choices = Choice.makeList(Plugins.listRepositoryProviders(), appSetting.value, true);
        // }

        return form
    }
}

module.exports.AppSettingForm = AppSettingForm;
