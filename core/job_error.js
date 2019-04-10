const { Constants } = require('./constants');

//---------------------------------------------------------------------//
// TODO: Delete this class in favor of JobStatus.
//---------------------------------------------------------------------//

/**
 * Job error describes an error that occurred while trying to run
 * a job.
 *
 * @param {string} msg - The error message to print to stderr.
 * This message will be automatically translated before printing.
 *
 * @param {string} errType - The type of error. Types are listed in
 * {@link Constants.ERR_TYPES}.
 *
 * @param {number} exitCode - The code to exit with (because,
 * remember, this method causes the process to exit). Exit codes
 * are defined in {@link Constants.EXIT_CODES}.
 */
class JobError {
    constructor(message, errorType, exitCode) {
        this.message = message;
        if (!Constants.ERR_TYPES.includes(errorType)) {
            throw `Unknown error type ${errorType}`;
        }
        this.type = type;
        if (!Constants.EXIT_CODES.includes(exitCode)) {
            throw `Unknown exit code ${exitCode}`;
        }
        this.exitCode = exitCode;
    }
    /**
     * This method prints an error to the process's stdout stream
     * The error message will be translated before printing. The output
     * is in JSON format, so it can be parsed by scripts or applications
     * that invoke DART command-line tools.
     */
    print() {
        process.stderr.write(JSON.stringify({error: this}));
    }
    /**
     * This method prints an error to the process's stdout stream
     * and exits with the specified code. The error message will
     * be translated before printing. The output is in JSON format,
     * so it can be parsed by scripts or applications that invoke DART
     * command-line tools.
     *
     * This method is intended only for use in command-line applications
     * and sub-processes spawned from the main UI. You should not call
     * this from the main UI process because it will cause the main
     * application to exit.
     */
    exit() {
        this.print();
        process.exit(exitCode);
    }
}

module.exports.JobError = JobError;
