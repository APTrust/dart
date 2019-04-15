const { Constants } = require('./constants');
const { Context } = require('./context');

/**
 * JobStatus holds information about a DART job running in
 * child process. The main {@link Worker} class collects messages
 * from events in child processes, wraps them in a JobStatus
 * object and prints them to STDOUT, where the parent process can
 * read them.
 */
class JobStatus {
    constructor(operation, action, message, status, errors, exception) {
        if (!Constants.OP_STATUSES.includes(status)) {
            throw Context.y18n.__('Invalid status: %s', status);
        }
        /**
         * The name of the operation that the child process is
         * currently carrying out. See {@link Constants.OP_STATUSES}
         * for a list of valid values.
         *
         * @type {string}
         */
        this.op = operation;
        /**
         * The action currently being carried out. Most operations
         * consist of multiple actions.
         *
         * @type {string}
         */
        this.action = action;
        /**
         * A message describing what is happening in the child process.
         *
         * @type {string}
         */
        this.msg = message;
        /**
         * The status of the child process. See {@link Constants.OP_STATUSES}.
         *
         * @type {string}
         */
        this.status = status;
        /**
         * A list of errors that occurred in the most recent action of
         * the child process.
         *
         * @type {Array<string>}
         */
        this.errors = errors || [];
        /**
         * An exception that occured in the most recent action of the child
         * process. This is usually null, since most errors are expected and
         * handled, and will show up in the {@link errors} array.
         *
         * When this is not null, it usually means an unexpected error
         * occurred which prevented the operation from completing.
         *
         * @type {string}
         */
        this.exception = exception || null;
    }
}

module.exports.JobStatus = JobStatus;
