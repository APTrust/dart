const ejs = require('ejs');
const { UI } = require('../common/ui');

const Manifest = UI.templates.log;

class ManifestController {

    constructor() {

    }

    show() {
        return 'Show Manifest';
    }

}

module.exports.ManifestController = ManifestController;
