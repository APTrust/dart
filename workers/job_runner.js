const { BagCreator } = require('./bag_creator');
const { BagValidator } = require('./bag_validator');
const { Job } = require('../core/job');
const { Uploader } = require('./uploader');
const { ValidationOperation } = require('../core/validation_operation');

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

            // TODO: Check result and stop if error.

            this.job.validationOp = new ValidationOperation(this.job.packageOp.outputPath);
            this.job.save();
        }

        if (this.job.validationOp) {
            let bagValidator = new BagValidator(this.job);
            await bagValidator.run();

            // TODO: Check result and stop if error.
        }

        if (this.job.uploadOps.length > 0) {
            let uploader = new Uploader(this.job);
            await uploader.run()
            console.log(this.job.uploadOps);

            // TODO: Check the results array of each uploadOp.
            // TODO: Retry those that failed due to non-fatal error.
        }

        // TODO: Exit with whatever code the last worker set.

        // TEMPORARY HACK to avoid electron lifecycle error.
        setTimeout(function() {
            process.exit(0);
        }, 1000);
    }
}

module.exports.JobRunner = JobRunner;
