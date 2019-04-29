const { BagCreator } = require('./bag_creator');
const { BagValidator } = require('./bag_validator');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { Job } = require('../core/job');
const { OperationResult } = require('../core/operation_result');
const { Uploader } = require('./uploader');
const { ValidationOperation } = require('../core/validation_operation');
const { Util } = require('../core/util');

/**
 * JobRunner runs a {@link Job} in a child process.
 *
 * @param {string} pathToFile - The path to the JSON file that contains
 * a description of the Job.
 *
 * @param {boolean} deleteJobFile - If true, the JobRunner will delete
 * the job file on completion. This defaults to false.
 */
class JobRunner {
    constructor(pathToFile, deleteJobFile = false) {
        this.jobFilePath = pathToFile;
        this.deleteJobFile = deleteJobFile;
        this.job = Job.inflateFromFile(pathToFile);
    }

    /**
     * This runs the job and returns a the process's exit code. For a list
     * of valid exit codes, see {@link Constants.EXIT_CODES}.
     *
     */
    async run() {
        let returnCode = Constants.EXIT_SUCCESS;
        try {
            returnCode = await this.createPackage();
            if (returnCode == Constants.EXIT_SUCCESS) {
                returnCode = await this.validatePackage();
            }
            if (returnCode == Constants.EXIT_SUCCESS) {
                returnCode = await this.uploadFiles();
            }
            this.removeJobFile();
            return returnCode;
        } catch (ex) {
            // Caller collects messages from STDERR.
            if (ex instanceof Error) {
                console.error(ex.stack);
            } else if (ex instanceof OperationResult && Context.isTestEnv) {
                // These come from rejected promises.
                // The output clutters Jest test output,
                // so suppress in test, but allow in dev/production.
            } else {
                console.error(JSON.stringify(ex))
            }
            console.error(Context.y18n.__(Constants.END_OF_ERROR_OUTPUT));
            returnCode = Constants.EXIT_RUNTIME_ERROR;
        }
        return returnCode;
    }

    /**
     * This creates the package, which may be a bag, a zip file, a tar
     * file, etc.
     */
    async createPackage() {
        // TODO: If job.packageOp && format isn't BagIt,
        // run a suitable packaging plugin.
        if (this.job.packageOp && this.job.packageOp.packageFormat == 'BagIt') {
            let bagCreator = new BagCreator(this.job);
            await bagCreator.run();
            this.job.save();
            if (bagCreator.exitCode == Constants.EXIT_SUCCESS) {
                this.job.validationOp = new ValidationOperation(this.job.packageOp.outputPath);
            }
            return bagCreator.exitCode;
        }
        return Constants.EXIT_SUCCESS;
    }

    /**
     * This validates the package. Currently, it only validates BagIt bags.
     */
    async validatePackage() {
        if (this.job.validationOp) {
            let bagValidator = new BagValidator(this.job);
            await bagValidator.run();
            this.job.save();
            return bagValidator.exitCode;
        }
        return Constants.EXIT_SUCCESS;
    }

    /**
     * This uploads files to each of the specified {@link UploadTarget}.
     */
    async uploadFiles() {
        // TODO: Retry those that failed due to non-fatal error.
        if (this.job.uploadOps.length > 0) {
            this.assignUploadSources();
            let uploader = new Uploader(this.job);
            try {
                await uploader.run();
            } catch (ex) {
                // Swallow rejected promise errors. They'll be handled above
                // by checking returnCode and uploadOp.result.errors.
            }
            this.job.save();
            return uploader.exitCode;
        }
        return Constants.EXIT_SUCCESS;
    }


    /**
     * This adds the output path of a newly created bag to the sourceFiles
     * property of an {@link UploadOperation}. The JobRunner does this after
     * it has successfully created a new bag.
     *
     * @private
     */
    assignUploadSources() {
        // TODO: Assign this in UI when user chooses an upload target?
        // User will upload either package sourcefiles or package output.
        let packOp = this.job.packageOp;
        for (let uploadOp of this.job.uploadOps) {
            if (packOp && packOp.outputPath && uploadOp.sourceFiles.length == 0) {
                uploadOp.sourceFiles.push(packOp.outputPath);
            }
        }
    }

    /**
     * This deletes the job file when the run is complete, but only if
     * the caller specified that the job file should be deleted.
     *
     */
    removeJobFile() {
        if (this.deleteJobFile) {
            fs.unlinkSync(this.jobFilePath);
        }
    }
}

module.exports.JobRunner = JobRunner;
