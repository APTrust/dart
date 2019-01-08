const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class ManifestController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
    }

    show() {
        return this.containerContent('Show Manifest');
    }

}

module.exports.ManifestController = ManifestController;
