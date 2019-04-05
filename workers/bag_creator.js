const { Bagger } = require('../bagit/bagger');
const { Constants } = require('../core/constants');
const { Job } = require('../core/job');
const { JobError } = require('../core/job_error');

class BagCreator {

    constructor(job) {
        this.job = job;
    }

    run() {
        this.validateParams();
        var creator = this;
        var bagger = new Bagger(this.job);
        bagger.on('packageStart', function(message) {
            process.stdout.write({
                op: 'PackageStart',
                message: message
            });
        });
        bagger.on('error', function(err) {
            new JobError(err, Constants.ERR_PACKAGING, Constants.EXIT_RUNTIME_ERROR).exit();
        });
        bagger.on('fileAdded', function(bagItFile) {
            console.log(`Added ${bagItFile.relDestPath}`);
            process.stdout.write({
                op: 'FileAdded',
                message: bagItFile.relDestPath
            });
        });
        var promise = new Promise(function(resolve, reject) {
            // Finish never fires. Why? But promise resolves. How?
            bagger.on('finish', function() {
                let result = bagger.job.packageOp.result;
                if (result.error) {
                    new JobError(result.error, Constants.ERR_PACKAGING, Constants.EXIT_COMPLETED_WITH_ERRORS).exit();
                } else {
                    // TODO: Validate the bag.
                    console.log(`Bag created at ${creator.job.packageOp.outputPath}`);
                    process.stdout.write({
                        op: 'Completed',
                        message: `Bag created at ${creator.job.packageOp.outputPath}`
                    });
                }
                resolve(result);
            });
        });
        bagger.create();
        return promise;
    }

    validateParams() {
        if (this.job.packageOp.sourceFiles.length < 1) {
            let msg = 'You must specify at least one source file or directory when creating a bag.';
            new JobError(msg, Constants.ERR_JOB_VALIDATION, Constants.EXIT_INVALID_PARAMS).exit();
        }
        if (!this.job.packageOp.outputPath) {
            let msg = 'Specify an output file or directory when creating a bag.'
            new JobError(msg, Constants.ERR_JOB_VALIDATION, Constants.EXIT_INVALID_PARAMS).exit();
        }
    }
}

module.exports.BagCreator = BagCreator;
