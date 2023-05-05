const { Form } = require('./form');

class AppSettingForm extends Form {

    constructor(appSetting) {
        super('AppSetting', appSetting);
        this._init();
    }

    _init() {
        if (!this.obj.userCanDelete) {
            this.fields['name'].attrs['disabled'] = true;
        }
    }

}

module.exports.AppSettingForm = AppSettingForm;
