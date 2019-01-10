const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class LogController extends BaseController {

    constructor(params) {
        super(params, 'Help');
    }

    show() {
        return this.containerContent('Show Log');
    }

}

module.exports.LogController = LogController;
