const { Constants } = require('../core/constants');
const dateFormat = require('dateformat');
const fs = require('fs');
const { OperationResult } = require('../core/operation_result');
const { Validator } = require('../bagit/validator');
const { Worker } = require('./worker');

/**
 * BagValidator validates a bag. It catches events from the
 * underlying {@link Validator}, wraps them in {@link JobStatus}
 * objects, and writes them to STDOUT and STDERR to communicate
 * with the parent process.
 *
 * param {Job} - The job to run. The job object must contain a
 * {@link BagItProfile} and a {@link ValidationOperation} to be
 * valid.
 *
 * @param {Job}
 */
class BagValidator extends Worker {

    constructor(job) {
        super('validate');
        this.job = job;
    }

    /**
     * This runs the job's validation operation, validating the bag.
     * It returns a promise.
     *
     * @returns {Promise}
     */
    run() {
        var bagValidator = this;

        // Return a failed promise if we get invalid params.
        let errors = this.validateParams();
        if (errors.length > 0) {
            return new Promise(function(resolve, reject) {
                reject(bagValidator.validationError(errors));
            });
        }

        this.initOpResult();

        return new Promise(function(resolve, reject) {
            let validator = new Validator(
                bagValidator.job.validationOp.pathToBag,
                bagValidator.job.bagItProfile);
            validator.on('error', function(err) {
                if (typeof err == 'string') {
                    bagValidator.job.validationOp.result.finish(err);
                    bagValidator.runtimeError('validate', [err], null);
                } else {
                    bagValidator.job.validationOp.result.finish(err.toString());
                    bagValidator.runtimeError('validate', null, err);
                }
                resolve(validator);
            });
            validator.on('end', function() {
                bagValidator.job.validationOp.result.finish();
                if (validator.errors.length > 0) {
                    bagValidator.job.validationOp.result.errors = validator.errors;
                    bagValidator.completedWithError(validator.errors);
                } else {
                    bagValidator.completedSuccess('Bag is valid');
                }
                resolve(validator);
            });
            validator.on('task', function(taskDesc) {
                bagValidator.info(taskDesc.op, Constants.OP_IN_PROGRESS, taskDesc.path, false);
            });
            validator.validate();
        });
    }

    /**
     * This initializes the {@link OperationResult} on the job's
     * {@link ValidationOperation}.
     *
     * @private
     */
    initOpResult() {
        if (this.job.validationOp.result == null) {
            this.job.validationOp.result = new OperationResult('validation', 'DART BagIt validator');
        }
        let result = this.job.validationOp.result;
        result.filepath = this.job.validationOp.pathToBag;

        let stats = fs.statSync(this.job.validationOp.pathToBag);
        if (stats.isFile()) {
            result.filesize = stats.size;
            result.fileMtime = stats.mtime;
        }
        result.start();
    }

    /**
     * This validates that the job object passed into the constructor
     * contains sufficient information for the validator to do its
     * work. The job must include a valid {@link ValidationOperation}
     * and a BagItProfile. Returns an array of error messages.
     *
     * @returns {Array<string>}
     * @private
     */
    validateParams() {
        this.job.validationOp.validate();
        let errors = Object.values(this.job.validationOp.errors);
        if (!this.job.bagItProfile) {
            errors.push("Cannot validate bag because job has no BagItProfile.");
        } else if (!this.job.bagItProfile.validate()) {
            errors = errors.concat(this.job.bagItProfile.errors);
        }
        return errors;
    }
}

module.exports.BagValidator = BagValidator;
