const Templates = require('../common/templates');

class AppSettingController {

    constructor(params) {
        this.params = params;
    }

    create() {
        return 'Create AppSetting';
    }

    update() {
        return 'Update AppSetting';
    }

    list() {
        return 'List AppSetting';
    }

    destroy() {
        return 'Destroy AppSetting';
    }
}

module.exports.AppSettingController = AppSettingController;
