const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class AboutController extends BaseController {

    constructor(params) {
        super(params);
    }

    show() {
        let data = {
            version: 'xxx',
            appPath: 'yyy',
            userDataPath: 'zzz'
        }
        let html = Templates.about(data);
        return this.modalContent('About DART', html);
    }

}

module.exports.AboutController = AboutController;
