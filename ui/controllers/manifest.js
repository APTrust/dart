const Templates = require('../common/templates');

class ManifestController {

    constructor(params) {
        this.params = params;
    }

    show() {
        return 'Show Manifest';
    }

}

module.exports.ManifestController = ManifestController;
