const { BagCreator } = require('./bag_creator');
const { BagValidator } = require('./bag_validator');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs')
const { Job } = require('../core/job');
const { OperationResult } = require('../core/operation_result');
const path = require('path')
const process = require('process')
const { Uploader } = require('./uploader');
const { Util } = require('../core/util');
const { ValidationOperation } = require('../core/validation_operation');
const { file } = require('tmp');

/**
 * JobRunner runs a {@link Job} in a child process.
 *
 * @param {string} job - The job to run.
 *
 */
class JobRunner {
    constructor(job) {
        this.job = job;
    }

    /**
     * This runs the job and returns a the process's exit code. For a list
     * of valid exit codes, see {@link Constants.EXIT_CODES}.
     *
     */
    async run() {
        let runner = this
        let returnCode = Constants.EXIT_SUCCESS;
        try {
            if (!runner.job.skipPackaging) {
                returnCode = await this.createPackage();
            }
            if (!runner.job.skipValidation && returnCode == Constants.EXIT_SUCCESS) {
                returnCode = await this.validatePackage();
            }
            if (returnCode == Constants.EXIT_SUCCESS) {
                returnCode = await this.uploadFiles();
                if (returnCode == Constants.EXIT_SUCCESS && this.job.deleteBagAfterUpload) {
                     runner.deleteBagAfterUpload(runner.job)
                }
            }
            runner.job.skipPackaging = false
            runner.job.skipValidation = false
            runner.job.save()
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
                // Save, so the result w/error is attached to the job record.
                this.job.save();
            }
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
     * This uploads files to each of the specified {@link StorageService}.
     */
    async uploadFiles() {
        // TODO: Retry those that failed due to non-fatal error.
        let runner = this 
        let returnCode = Constants.EXIT_SUCCESS;
        if (this.job.uploadOps.length > 0) {
            this.assignUploadSources();
            let uploader = new Uploader(this.job);
            var promise = new Promise(function (resolve, reject) {
                let fileCount = runner.job.uploadOps[0].sourceFiles.length
                let completedCount = 0
                uploader.on('message', function (message) {
                    if (message.action == "completed") {
                        //console.log(message.status)
                        completedCount += 1;
                        // Note that completed does not mean succeeded. It just means
                        // the uploader is done working on this upload. When all uploads
                        // are complete, we'll delete the local copy of the bag, 
                        // if necessary. Note the conditions below.
                        if (completedCount == fileCount) {
                            runner.job.save();
                            if (!runner.job.uploadSucceeded()) {
                                returnCode = Constants.EXIT_RUNTIME_ERROR
                            }
                            return resolve(returnCode);
                        }
                    }                    
                })                
            })
            await uploader.run()
            return promise
        } else {
            return new Promise(function(resolve, reject) {
                resolve(returnCode)
            })
        }
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
            //uploadOp.sourceFiles = []
            if (packOp && packOp.outputPath && uploadOp.sourceFiles.length == 0) {
                if (Util.isDirectory(packOp.outputPath)) {
                    // Add the directory and all its contents to the upload source files
                    // let filter = (f) => !f.stats.isDirectory()
                    uploadOp.sourceFiles = Util.walkSync(packOp.outputPath).filter((f) => !f.stats.isDirectory()).map((f) => f.absPath)
                    for (let i=0; i < uploadOp.sourceFiles.length; i++) {
                        let absPath = uploadOp.sourceFiles[i]
                        uploadOp.sourceKeys[i] = absPath.replace(path.dirname(this.job.packageOp.outputPath) + path.sep, "")
                        //console.log(absPath)
                    }
                } else {
                    // This is an individual file
                    uploadOp.sourceFiles.push(packOp.outputPath);
                }
            }
        }
    }

    /**
     * This deletes a bag after successful upload if job.deleteBagAfterUpload
     * is true.
     * 
     * @param {Job} job
     * @param {OperationResult} result 
     * 
     * @returns {void}
     */
    deleteBagAfterUpload(job) {
        if (!job.deleteBagAfterUpload) {
            return
        }
        let lastResult = null;
        let someUploadDidNotComplete = false
        for (let i=0; i < job.uploadOps.length; i++) {
            let uploadOp = job.uploadOps[i]

            // If no results, this particular upload
            // hasn't been attempted yet.
            if (uploadOp.results.length == 0) {
                someUploadDidNotComplete = true
                break
            }
            // Check whether any part of an upload failed.
            for (let j=0; j < uploadOp.results.length; j++) {
                let result = uploadOp.results[j]
                if (!result.succeeded()) {
                    someUploadDidNotComplete = true
                }
                lastResult = result
            }
        }
        // If this is true, either 1) some upload failed, 
        // or 2) the job has other pending uploads. In 
        // either case, we don't want to delete the local
        // copy of the bag.
        if (someUploadDidNotComplete) {
            return
        }
        let bag = job.packageOp.outputPath
        try {
            if (Util.isDirectory(bag)) {
                fs.rmSync(bag, {recursive: true})
            } else {
                fs.unlinkSync(bag)
            }
            job.bagWasDeletedAfterUpload = true
        } catch(ex) {
            console.error(ex)
            job.bagWasDeletedAfterUpload = false
            if (lastResult) {
                lastResult.errors.push(`Upload completed but cound not delete bag ${bag}. Error: ${ex}`)
            }
        }
    }    


}

module.exports.JobRunner = JobRunner;
