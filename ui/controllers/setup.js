const ejs = require('ejs');
const { UI } = require('../common/ui');

const Start = UI.templates.setupStart;
const Question = UI.templates.setupQuestion;

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
