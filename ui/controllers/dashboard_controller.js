const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class DashboardController extends BaseController {

    constructor(params) {
        super(params, 'Dashboard')
    }

    show() {
        let html = Templates.dashboard({});
        return this.containerContent(html);
    }

    _getRunningJobs() {

    }

    _getRecentJobs() {

    }

    _getConnectableRepos() {

    }

}

module.exports.DashboardController = DashboardController;
