const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class AppSettingController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
    }

    create() {
        return 'Create AppSetting';
    }

    update() {
        return 'Update AppSetting';
    }

    list() {
        return this.containerContent('List AppSetting');
    }

    destroy() {
        return 'Destroy AppSetting';
    }
}

module.exports.AppSettingController = AppSettingController;
