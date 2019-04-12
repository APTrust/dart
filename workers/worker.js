const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { JobStatus } = require('../core/job_status');
const { Util } = require('../core/util');

class Worker {
    constructor(operation) {
        this.operation = operation;
        this.exitCode = Constants.EXIT_SUCCESS;
    }

    info(action, status, message, translate = true) {
        let msg = translate ? Context.y18n.__(message) : message;
        let jobStatus = new JobStatus(
            this.operation,
            action,
            msg,
            status
        );
        this.writeJson('stdout', jobStatus);
        return true;
    }

    completedSuccess(message, translate = true) {
        this.exitCode = Constants.EXIT_SUCCESS;
        return this.info('completed', Constants.OP_SUCCEEDED, message, translate);
    }

    /**
     * Print a message to stdout saying the operation cannot be
     * attempted because it includes invalid parameters.
     */
    validationError(errors) {
        this.exitCode = Constants.EXIT_INVALID_PARAMS;
        return this._err('validate', errors, null, 'Operation has invalid parameters.');
    }

    /**
     * Print a message to stdout saying the operation did not complete
     * due to runtime errors.
     */
    runtimeError(action, errors, exception) {
        this.exitCode = Constants.EXIT_RUNTIME_ERROR;
        return this._err(action, errors, exception, 'Runtime error.');
    }

    /**
     * Print a message to stdout saying the operation completed with
     * errors.
     */
    completedWithError(errors) {
        this.exitCode = Constants.EXIT_COMPLETED_WITH_ERRORS;
        return this._err('completed', errors, null, 'Operation completed with errors.');
    }


    _err(action, errors, exception, message) {
        let jobStatus = new JobStatus(
            this.operation,
            action,
            Context.y18n.__(message),
            Constants.OP_FAILED,
            errors
        );
        this.writeJson('stderr', jobStatus);
        return false;
    }

    /**
     * Write data in JSON format to stderr or stdout.
     *
     * @param {string} stream - The name of the stream to write to.
     * this must be either 'stdout' or 'stderr'.
     *
     * @param {object} data - The data to write.
     */
    writeJson(stream, data) {
        let jsonStr = JSON.stringify(data) + "\n";
        if (stream == 'stdout') {
            process.stdout.write(jsonStr);
        } else if (stream == 'stderr') {
            process.stderr.write(jsonStr);
        } else {
            throw Context.y18n.__("Invalid stream name: %s", stream);
        }
    }

}

module.exports.Worker = Worker;
