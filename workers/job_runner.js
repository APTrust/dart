const { BagCreator } = require('./bag_creator');
const { BagValidator } = require('./bag_validator');
const { Job } = require('../core/job');
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
            this.job.validationOp = new ValidationOperation(this.job.packageOp.outputPath);
            this.job.save();
        }

        // this.job.validationOp = new ValidationOperation('/Users/apd4n/tmp/dart/example.edu.tagsample_good.tar');

        if (this.job.validationOp) {
            let bagValidator = new BagValidator(this.job);
            await bagValidator.run();
        }
    }
}

module.exports.JobRunner = JobRunner;
