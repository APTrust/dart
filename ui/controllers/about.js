const Templates = require('../common/templates');

class AboutController {

    constructor(params) {
        this.params = params;
    }

    show() {
        return 'Show About';
    }

}

module.exports.AboutController = AboutController;
