const { Constants } = require('../core/constants');
const dateFormat = require('dateformat');
const fs = require('fs');
const { OperationResult } = require('../core/operation_result');
const { Validator } = require('../bagit/validator');
const { Worker } = require('./worker');

class BagValidator extends Worker {

    constructor(job) {
        super('validate');
        this.job = job;
    }

    run() {
        let errors = this.validateParams();
        if (errors.length > 0) {
            return this.validationError();
        }
        this.initOpResult();

        var bagValidator = this;
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
                    bagValidator.completedWithError('validation', validator.errors);
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

    // Should this be moved into the validator?
    initOpResult() {
        if (this.job.validationOp.result == null) {
            this.job.validationOp.result = new OperationResult('Validation', 'DART BagIt validator');
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

    validateParams() {
        this.job.validationOp.validate();
        let errors = Object.values(this.job.validationOp.errors);
        if (!this.job.bagItProfile) {
            errors.push("Cannot validate bag because job has no BagItProfile.");
        }
        return errors;
    }
}

module.exports.BagValidator = BagValidator;
