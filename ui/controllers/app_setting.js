const Templates = require('../common/templates');

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
