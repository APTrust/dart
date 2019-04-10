const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { JobStatus } = require('../core/job_status');
const { Util } = require('../core/util');

class Worker {
    constructor(operation) {
        this.operation = operation;
    }

    info(action, status, message, translate = true) {
        let msg = translate ? Context.y18n.__(message) : message;
        let jobStatus = new JobStatus(
            this.operation,
            action,
            msg,
            status
        );
        Util.writeJson('stdout', jobStatus);
        return true;
    }

    /**
     * Print a message to stdout saying the operation cannot be
     * attempted because it includes invalid parameters.
     */
    validationError(action, errors) {
        return this._err(action, errors, null, 'Operation has invalid parameters.');
    }

    /**
     * Print a message to stdout saying the operation did not complete
     * due to runtime errors.
     */
    runtimeError(action, errors, exception) {
        return this._err(action, errors, exception, 'Runtime error.');
    }

    /**
     * Print a message to stdout saying the operation completed with
     * errors.
     */
    completedWithError(action, errors) {
        return this._err(action, errors, null, 'Operation completed with errors.');
    }


    _err(action, errors, exception, message) {
        let jobStatus = new JobStatus(
            this.operation,
            action,
            Context.y18n.__(message),
            Constants.OP_FAILED,
            errors
        );
        Util.writeJson('stdout', jobStatus);
        return false;
    }

}

module.exports.Worker = Worker;
