const Templates = require('../common/templates');

class SetupController {

    constructor(setup) {
        this.setup = setup;
    }

    start() {
        return 'Start Setup';
    }

    next(params) {
        return 'Next Setup';
    }

}

module.exports.SetupController = SetupController;
