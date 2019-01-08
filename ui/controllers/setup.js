const Templates = require('../common/templates');

class SetupController {

    constructor(params) {
        this.params = params;
    }

    start() {
        return 'Start Setup';
    }

    next(params) {
        return 'Next Setup';
    }

}

module.exports.SetupController = SetupController;
