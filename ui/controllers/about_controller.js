const { BaseController } = require('./base_controller');
const Dart = require('../../core');
const Templates = require('../common/templates');

class AboutController extends BaseController {

    constructor(params) {
        super(params);
    }

    show() {
        var app = require('electron').remote.app;
        let data = {
            version: Dart.Context.dartVersion(),
            appPath: app.getAppPath(),
            userDataPath: app.getPath('userData')
        }
        let html = Templates.about(data);
        return this.modalContent('About DART', html);
    }

}

module.exports.AboutController = AboutController;
