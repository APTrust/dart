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
        if (this.job.packageOp && this.job.packageOp.packageFormat == 'BagIt') {
            let bagCreator = new BagCreator(this.job);
            await bagCreator.run();
            this.job.save();
            if (bagCreator.exitCode != Constants.EXIT_SUCCESS) {
                return bagCreator.exitCode;
            }
            this.job.validationOp = new ValidationOperation(this.job.packageOp.outputPath);
        }

        // TODO: If job.packageOp && format isn't BagIt,
        // run a suitable packaging plugin.

        if (this.job.validationOp) {
            let bagValidator = new BagValidator(this.job);
            await bagValidator.run();
            this.job.save();
            if (bagValidator.exitCode != Constants.EXIT_SUCCESS) {
                return bagValidator.exitCode;
            }
        }

        if (this.job.uploadOps.length > 0) {
            this.assignUploadSources();
            let uploader = new Uploader(this.job);
            await uploader.run()
            this.job.save();
            if (uploader.exitCode != Constants.EXIT_SUCCESS) {
                return uploader.exitCode;
            }
            // TODO: Retry those that failed due to non-fatal error.
        }
        return Constants.EXIT_SUCCESS;
    }


    // TODO: Assign this in UI when user chooses an upload target?
    // User will upload either package sourcefiles or package output.
    assignUploadSources() {
        let packOp = this.job.packageOp;
        //console.log("Has packOp");
        for (let uploadOp of this.job.uploadOps) {
            //console.log("Has uploadOp");
            if (packOp && packOp.outputPath && uploadOp.sourceFiles.length == 0) {
                uploadOp.sourceFiles.push(packOp.outputPath);
            }
        }
    }
}

module.exports.JobRunner = JobRunner;
