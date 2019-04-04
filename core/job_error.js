const { Constants } = require('./constants');

/**
 * Job error describes an error that occurred while trying to run
 * a job.
 *
 */
class JobError {
    constructor(type, message) {
        this.message = message;
        if (!Constants.ERR_TYPES.includes(type)) {
            throw `Unknown error type ${type}`;
        }
        this.type = type;
    }
    print() {
        process.stderr.write(JSON.stringify({error: this}));
    }
}

module.exports.JobError = JobError;
