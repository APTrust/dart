const ejs = require('ejs');
const { UI } = require('../common/ui');

const Form = UI.templates.appSettingForm;
const List = UI.templates.appSettingList;

class AppSettingController {

    constructor(appSetting) {
        this.appSetting = appSetting;
    }

    create() {
        return 'Create AppSetting';
    }

    update(params) {
        return 'Update AppSetting';
    }

    list(params) {
        return 'List AppSetting';
    }

    destroy() {
        return 'Destroy AppSetting';
    }
}

module.exports.AppSettingController = AppSettingController;
