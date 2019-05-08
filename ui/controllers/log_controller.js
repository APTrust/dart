const $ = require('jquery');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const readLastLines = require('read-last-lines');
const { Tail } = require('tail');
const Templates = require('../common/templates');

class LogController extends BaseController {

    constructor(params) {
        super(params, 'Help');
    }

    show() {
        return this.containerContent(Templates.logShow());
    }


    postRenderCallback(fnName) {
        let tail = new Tail(Context.logger.pathToLogFile());
        readLastLines.read(Context.logger.pathToLogFile(), 100)
            .then((lines) => $('#logDiv').text(lines))
            .then(() => {
                tail.on("line", function(data) {
                    $('#logDiv').append(data);
                });
            });

    }
}

module.exports.LogController = LogController;
