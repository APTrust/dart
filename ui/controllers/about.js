const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class AboutController extends BaseController {

    constructor(params) {
        super(params);
    }

    show() {
        return this.modalContent('About DART', 'About text is coming soon.');
    }

}

module.exports.AboutController = AboutController;
