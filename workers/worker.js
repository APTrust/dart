const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const EventEmitter = require('events');
const { JobStatus } = require('../core/job_status');

class Worker extends EventEmitter {
    constructor(operation) {
        super();
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

    info(action, status, message, percentComplete, translate = true) {
        let msg = translate ? Context.y18n.__(message) : message;
        let jobStatus = new JobStatus(
            this.operation,
            action,
            msg,
            status,
            percentComplete
        );
        Context.logger.info(`${this.operation}/${action} - ${msg}`);
        this._emitStatusMessage(jobStatus);
        return true;
    }

    completedSuccess(message, translate = true) {
        this.exitCode = Constants.EXIT_SUCCESS;
        return this.info('completed', Constants.OP_SUCCEEDED, message, 100, translate);
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
            -1,
            errors,
            exception
        );
        // Why can we not print two consecutive error messages
        // using Context.logger.error? For now, merge all data
        // into a single message.
        let msg = `${this.operation}/${action} - ${message} `;
        if (errors) {
            msg += errors.join(', ');
        }
        if (exception) {
            msg += `${exception.message} ... ${exception.stack}`;
        }
        Context.logger.error(msg);
        this._emitStatusMessage(jobStatus);
        return false;
    }


    /**
     * This emits a status message through an appropriate channel.
     * If this process is the child of another Node process, this uses
     * process.send(). Otherwise, it emits a 'message' event. Either way,
     * the listener can attach to on('message') and expect to get a
     * {@link JobStatus} object.
     *
     */
    _emitStatusMessage(jobStatus) {
        // Jest tests run as subprocesses, but test function is not
        // the parent process & cannot receive, so use emit for Jest.
        if (typeof process.send == 'function' && !Context.isTestEnv) {
            process.send(jobStatus);
        } //else {
            this.emit('message', jobStatus);
        //}
    }

}

module.exports.Worker = Worker;
