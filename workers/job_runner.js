const { BagCreator } = require('./bag_creator');
const { BagValidator } = require('./bag_validator');
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

            // TODO: Check the results array of each uploadOp.
            // TODO: Retry those that failed due to non-fatal error.
        }

        // TODO: Exit with whatever code the last worker set.

        // TEMPORARY HACK to avoid electron lifecycle error.
        setTimeout(function() {
            process.exit(0);
        }, 1000);
    }

    printJobStart() {
        Util.writeJson('stdout', {
            op: 'JobStart',
            message: Context.y18n.__('Job started')
        });
    }

    printJobComplete() {
        let message = Context.y18n.__('Job completed successfully');
        let succeeded = true;
        if (this.job) {

        }
        Util.writeJson('stdout', {
            op: 'JobComplete',
            message: message
        });
    }
}

module.exports.JobRunner = JobRunner;
