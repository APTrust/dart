const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { JobStatus } = require('../core/job_status');
const { Util } = require('../core/util');

class Worker {
    constructor(operation) {
        /**
         * The name of the operation being performed. Can be
         * package, validate, or upload.
         *
         * @type {string}
         */
        this.operation = operation;
        /**
         * The worker's exit code. See {@link Constants.EXIT_CODES}.
         * For upload operations, ignore this and check the result of
         * all returned promises instead, because each upload operation
         * resets the worker's exit code. [This needs a proper fix.]
         *
         * @type {number}
         */
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
        Context.logger.info(jobStatus);
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

    /**
     * Prints a JobStatus object containing an error message to STDOUT.
     * Note that this forces the status to FAILED. This always returns
     * false.
     *
     * @param {string} action - The action that the process is currently
     * carrying out.
     *
     * @param {Array<string>} errors - A list of error messages. This can
     * be empty if you pass an exception instead.
     *
     * @param {Error} exception - The exception that occurred during
     * processing. This can be (and usually is) null.
     *
     * @param {string} message - A message to display to the user.
     *
     * @returns {boolean}
     * @private
     */
    _err(action, errors, exception, message) {
        let jobStatus = new JobStatus(
            this.operation,
            action,
            Context.y18n.__(message),
            Constants.OP_FAILED,
            errors,
            exception
        );
        Context.logger.error(jobStatus);
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
        let jsonStr = JSON.stringify(data);
        if (data.exception) {
            let exStr = JSON.stringify(
                data.exception,
                Object.getOwnPropertyNames(data.exception))
            jsonStr = jsonStr.replace('"exception":{}', `"exception":${exStr}`);
        }
        if (stream == 'stdout') {
            console.log(jsonStr);
        } else if (stream == 'stderr') {
            console.error(jsonStr);
        } else {
            throw new Error(Context.y18n.__("Invalid stream name: %s", stream));
        }
    }

}

module.exports.Worker = Worker;
