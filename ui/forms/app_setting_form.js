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
        form.fields['name'].help = appSetting.help;

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
