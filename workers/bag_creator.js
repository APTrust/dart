const { Bagger } = require('../bagit/bagger');
const { Constants } = require('./constants');
const { Job } = require('../core/job');
const { JobError } = require('../core/job_error');

class BagCreator {

    constructor(job) {
        this.opts = opts;
        this.exitCode = Constants.EXIT_SUCCESS;
    }

    run() {
        var creator = this;
        var bagger = new Bagger(job);

        bagger.on('error', function(err) {
            this.exitCode = Constants.EXIT_COMPLETED_WITH_ERRORS;
            console.log(err);
            //throw(err);
        });
        bagger.on('fileAdded', function(bagItFile) {
            console.log(bagItFile.relDestPath);
        });
        var promise = new Promise(function(resolve, reject) {
            // Finish never fires. Why? But promise resolves. How?
            bagger.on('finish', function() {
                let result = bagger.job.packageOp.result;
                if (result.error) {
                    creator.exitCode = Constants.EXIT_COMPLETED_WITH_ERRORS;
                    console.log(result.error);
                } else {
                    // TODO: Validate the bag.
                    console.log(`Bag created at ${creator.opts.output}`);
                }
                resolve(result);
            });
        });
        bagger.create();
        return promise;
    }

    validateOpts() {
        if (this.job.packageOp.sourceFiles.length < 1) {
            let msg = 'You must specify at least one source file or directory when creating a bag.';
            this.exitWithError(msg, Constants.ERR_JOB_VALIDATION, Constants.EXIT_INVALID_PARAMS);
        }
        if (!this.job.packageOp.outputPath) {
            let msg = 'Specify an output file or directory when creating a bag.'
            this.exitWithError(msg, Constants.ERR_JOB_VALIDATION, Constants.EXIT_INVALID_PARAMS);
        }
    }

    exitWithError(msg, errType, exitCode) {
        new JobError(errType, Context.y18n.__(msg)).print();
        process.exit(exitCode);
    }

    parseTags() {
        for (var tagString of this.opts.tags) {
            this.tags.push(TagDefinition.fromCommandLineArg(tagString));
        }
    }

}

module.exports.BagCreator = BagCreator;
