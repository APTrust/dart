const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class SetupController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
    }

    start() {
        return this.containerContent('Start Setup');
    }

    next(params) {
        return this.containerContent('Next Setup');
    }

}

module.exports.SetupController = SetupController;
