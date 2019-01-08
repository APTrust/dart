const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class DashboardController extends BaseController {

    constructor(params) {
        super(params, 'Dashboard')
    }

    show() {
        return this.containerContent('Show Dashboard');
    }

}

module.exports.DashboardController = DashboardController;
