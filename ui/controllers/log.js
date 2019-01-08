const Templates = require('../common/templates');

class LogController {

    constructor(params) {
        this.params = params;
    }

    show() {
        return 'Show Log';
    }

}

module.exports.LogController = LogController;
