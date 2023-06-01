const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class HelpController extends BaseController {

    constructor(params) {
        super(params, 'Help');
    }

    show() {
        return this.containerContent('Show Help');
    }

}

module.exports.HelpController = HelpController;
