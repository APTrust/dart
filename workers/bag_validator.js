const { Constants } = require('../core/constants');
const dateFormat = require('dateformat');
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

        var bagValidator = this;
        return new Promise(function(resolve, reject) {
            let validator = new Validator(
                bagValidator.job.validationOp.pathToBag,
                bagValidator.job.bagItProfile);
            validator.on('error', function(err) {
                if (typeof err == 'string') {
                    bagValidator.runtimeError('validate', [err], null);
                } else {
                    bagValidator.runtimeError('validate', null, err);
                }
                resolve(validator);
            });
            validator.on('end', function() {
                if (validator.errors.length > 0) {
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
