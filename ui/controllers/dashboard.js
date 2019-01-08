const Templates = require('../common/templates');

class DashboardController {

    constructor(params) {
        this.params = params;
    }

    show() {
        return 'Show Dashboard';
    }

}

module.exports.DashboardController = DashboardController;
