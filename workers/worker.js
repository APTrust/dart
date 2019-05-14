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
        Context.logger.info(`${this.operation}/${action} - ${msg}`);
        this._emitStatusMessage(jobStatus);
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
        Context.logger.error(`${this.operation}/${action} - ${message}`);
        this._emitStatusMessage(jobStatus);
        return false;
    }


    /**
     * This emits a status message through an appropriate channel.
     *
     * If our worker is running as a child process (usually of the
     * main Electron GUI), the message is sent via process.send()
     * to the parent. The parent process determines how to deal
     * with the message. See {@link JobRunner}.
     *
     * If our worker is running as the parent process, the message
     * goes to STDERR if it contains errors or exceptions, or to STDOUT
     * otherwise.
     *
     */
    _emitStatusMessage(jobStatus) {
        let hasErrors = jobStatus.errors.length > 0|| jobStatus.exception != null;
        let writeFn = hasErrors ? console.error : console.log;
        if (process.send && !Context.isTestEnv) {
            process.send(jobStatus);
        } else {
            writeFn(JSON.stringify(jobStatus));
        }
    }

}

module.exports.Worker = Worker;
