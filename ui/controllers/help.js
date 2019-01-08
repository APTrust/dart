const ejs = require('ejs');
const { UI } = require('../common/ui');

const Help = UI.templates.help;

class HelpController {

    constructor() {

    }

    show() {
        return 'Show Help';
    }

}

module.exports.HelpController = HelpController;
