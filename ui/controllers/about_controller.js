const { BaseController } = require('./base_controller');
const Dart = require('../../core');
const { InternalSetting } = require('../../core/internal_setting')
const Templates = require('../common/templates');

class AboutController extends BaseController {

    constructor(params) {
        super(params);
    }

    show() {
        let data = {
            version: Dart.Context.dartVersion(),
            appPath: InternalSetting.firstMatching('name', 'AppPath').value,
            userDataPath: InternalSetting.firstMatching('name', 'UserDataPath').value,
            logFilePath: Dart.Context.logger.pathToLogFile()
        }
        let html = Templates.about(data);
        return this.modalContent('About DART', html);
    }

}

module.exports.AboutController = AboutController;
