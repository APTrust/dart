const { Constants } = require('./constants');
const { Context } = require('./context');

class JobStatus {
    constructor(operation, action, message, status, errors, exception) {
        if (!Constants.OP_STATUSES.includes(status)) {
            throw Context.y18n.__('Invalid status: %s', status);
        }
        this.op = operation;
        this.action = action;
        this.msg = message;
        this.status = status;
        this.errors = errors || [];
        this.exception = exception || null;
    }
}

module.exports.JobStatus = JobStatus;
