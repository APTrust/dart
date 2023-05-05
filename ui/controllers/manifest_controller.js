const { BaseController } = require('./base_controller');

class ManifestController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
    }

    list() {
        return this.containerContent('List Manifests');
    }

    show() {
        return this.containerContent('Show Manifest');
    }

}

module.exports.ManifestController = ManifestController;
