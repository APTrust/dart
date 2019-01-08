const ejs = require('ejs');
const { UI } = require('../common/ui');

const Dash = UI.templates.dashboard;

class DashboardController {

    constructor() {

    }

    show() {
        return 'Show Dashboard';
    }

}

module.exports.DashboardController = DashboardController;
