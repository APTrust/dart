const { BagCreator } = require('./bag_creator');
const { BagValidator } = require('./bag_validator');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { Job } = require('../core/job');
const { Uploader } = require('./uploader');
const { ValidationOperation } = require('../core/validation_operation');
const { Util } = require('../core/util');

class JobRunner {
    constructor(pathToFile) {
        this.job = Job.inflateFromFile(pathToFile);
    }
    async run() {
        // --------------------------------------------------------------
        // TODO: Catch the child process's stdout, stderr, and exit code.
        // --------------------------------------------------------------
        if (this.job.packageOp && this.job.packageOp.packageFormat == 'BagIt') {
            let bagCreator = new BagCreator(this.job);
            await bagCreator.run();
            this.job.save();
            if (bagCreator.exitCode != Constants.EXIT_SUCCESS) {
                this.exit(bagCreator.exitCode);
            }
            this.job.validationOp = new ValidationOperation(this.job.packageOp.outputPath);
        }

        // TODO: If job.packageOp && format isn't BagIt

        if (this.job.validationOp) {
            let bagValidator = new BagValidator(this.job);
            await bagValidator.run();
            this.job.save();
            if (bagValidator.exitCode != Constants.EXIT_SUCCESS) {
                this.exit(bagValidator.exitCode);
            }
        }

        if (this.job.uploadOps.length > 0) {
            let uploader = new Uploader(this.job);
            await uploader.run()
            this.job.save();
            if (uploader.exitCode != Constants.EXIT_SUCCESS) {
                this.exit(uploader.exitCode);
            }
            // TODO: Retry those that failed due to non-fatal error.
        }
        this.exit(Constants.EXIT_SUCCESS);
    }

    exit(exitCode) {
        // TEMPORARY HACK to avoid electron lifecycle error.
        setTimeout(function() {
            process.exit(exitCode);
        }, 1000);
    }

}

module.exports.JobRunner = JobRunner;
