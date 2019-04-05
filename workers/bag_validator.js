//const { BagItProfile } = require('../bagit/bagit_profile');
//const CLI = require('./cli_constants');
const { Constants } = require('../core/constants');
const dateFormat = require('dateformat');
const { Validator } = require('../bagit/validator');

class BagValidator {

    constructor(job) {
        this.job = job;
        this.debug = false;
        this.exitCode = Constants.EXIT_SUCCESS;
    }

    run() {
        this.validateParams();
        var bagValidator = this;
        return new Promise(function(resolve, reject) {
            let validator = new Validator(
                bagValidator.job.validationOp.pathToBag,
                bagValidator.job.bagItProfile);
            validator.on('error', function(err) {
                bagValidator.exitCode = Constants.EXIT_RUNTIME_ERROR;
                resolve(validator);
            });
            validator.on('end', function() {
                if (validator.errors.length > 0) {
                    bagValidator.exitCode = Constants.EXIT_COMPLETED_WITH_ERRORS;
                    console.log("Bag has the following errors:");
                    for (let e of validator.errors) {
                        console.log(`    ${e}`);
                    }
                } else {
                    console.log('Bag is valid.');
                }
                resolve(validator);
            });
            if (bagValidator.debug) {
                validator.on('task', function(taskDesc) {
                    let ts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l");
                    let msg = taskDesc.msg || '';
                    console.log(`  [debug] [${ts}] ${taskDesc.op} ${taskDesc.path} ${msg}`);
                });
            }
            validator.validate();
        });
    }

    validateParams() {
        if (!this.job.bagItProfile) {
            let msg = "Cannot validate bag because job has no BagItProfile.";
            new JobError(msg,
                         Constants.ERR_JOB_VALIDATION,
                         Constants.EXIT_INVALID_PARAMS).exit();
        }
        if (!this.job.validationOp || !this.job.validationOp.pathToBag) {
            let msg = "Cannot validate bag: path to bag is missing.";
            new JobError(msg,
                         Constants.ERR_JOB_VALIDATION,
                         Constants.EXIT_INVALID_PARAMS).exit();
        }
    }
}

module.exports.BagValidator = BagValidator;
