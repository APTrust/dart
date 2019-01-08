const ejs = require('ejs');
const { UI } = require('../common/ui');

const Log = UI.templates.log;

class LogController {

    constructor() {

    }

    show() {
        return 'Show Log';
    }

}

module.exports.LogController = LogController;
