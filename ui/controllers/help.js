const Templates = require('../common/templates');

class HelpController {

    constructor(params) {
        this.params = params;
    }

    show() {
        return 'Show Help';
    }

}

module.exports.HelpController = HelpController;
