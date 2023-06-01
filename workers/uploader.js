const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const path = require('path');
const { OperationResult } = require('../core/operation_result');
const { PluginManager } = require('../plugins/plugin_manager');
const { StorageService } = require('../core/storage_service');
const { Util } = require('../core/util');
const { UIConstants } = require('../ui/common')
const { Worker } = require('./worker');
const { file } = require('tmp');

// This implementation is convoluted and messy...

/**
 * The Uploader performs the upload operations for a job.
 * It catches events from the underlying network plugin,
 * wraps them in {@link JobStatus} objects, and writes them
 * to STDOUT and STDERR to communicate with the parent process.
 *
 * param {Job} - The job to run. The job object must contain at
 * at least one {@link UploadOperation}, or the upload will do
 * nothing.
 *
 * @param {Job}
 *
 */
class Uploader extends Worker {

    constructor(job) {
        super('upload')
        this.job = job;
    }

    /**
     * This runs all of the job's upload operations.
     * It returns an array of promises. This runs all uploads
     * in parallel.
     *
     * @returns {Array<Promise>}
     */
    run() {
        let uploader = this;
        let errors = this.validateParams();
        if (errors.length > 0) {
            return Promise.all([new Promise(function(resolve, reject) {
                reject(uploader.validationError(errors));
            })]);
        }
        let promises = [];
        for (let op of this.job.uploadOps) {
            promises = promises.concat(this.doUpload(op));
        }
        return Promise.all(promises);
    }

    /**
     * doUpload initiates a single upload operation and returns
     * an array of promises. If a single operation includes multiple
     * source files, it will upload them in parallel. This returns
     * one promise per source file.
     *
     * Because each upload resets the exitCode, the caller should
     * ignore the final exitCode and check the results of all of the
     * promises instead. [This needs a more elegant fix.]
     *
     * @param {UploadOperation} - An upload operation containing one
     * or more source files.
     *
     * @returns {Array<Promise>}
     */
    doUpload(uploadOp) {
        let uploader = this;
        // Clear prior upload results. They may cause the UI to
        // report successful upload as failed, or vice-versa.
        uploadOp.results = [];
        let ss = StorageService.find(uploadOp.storageServiceId);
        if (!ss) {
            uploadOp.results[0] = new OperationResult('upload', 'none');
            uploadOp.results[0].start();
            uploadOp.results[0].finish(Context.y18n.__('Cannot find StorageService record'));
            return new Promise(function(resolve, reject) {
                reject(uploader.validationError(uploadOp.results[0].errors));
            });

        }
        let providerClass = this.getProvider(ss.protocol);
        let promises = [];
        for (let filepath of uploadOp.sourceFiles) {
            let f = path.basename(filepath)
            let provider = new providerClass(ss);
            var promise = new Promise(function(resolve, reject) {
                let lastPercentComplete = 0;
                provider.on('start', function(result) {
                    // Note: percentComplete is -1 because we don't
                    // yet have a way of getting that info.
                    uploader.info('start',
                                  Constants.OP_IN_PROGRESS,
                                  `${ss.name}: ${f}`,
                                  -1,
                                  false);
                });
                provider.on('finish', function(result) {
                    uploadOp.results.push(result);
                    if (result.errors.length > 0) {
                        uploader.completedWithError(result.errors);
                    } else {                        
                        uploader.completedSuccess(`${UIConstants.GREEN_CHECK_CIRCLE} ${f} -> ${ss.name}`, false);
                    }
                    resolve(result);
                });
                provider.on('error', function(result) {
                    // Reject causes the entire Promise.all chain
                    // to fail. We want to let other pending promises
                    // complete instead of stopping the chain. We will
                    // handle retries elsewhere.
                    uploadOp.results.push(result);
                    uploader.runtimeError('completed', result.errors);
                    resolve(result);
                    provider = null;
                });
                provider.on('warning', function(result) {
                    // Note: percentComplete is -1 because we don't
                    // yet have a way of getting that info.
                    uploader.info('upload', Constants.OP_IN_PROGRESS,
                                  ` ${f} ${result.warning}`, -1, false);
                });
                provider.on('status', function(xfer) {
                    // Uploader reads faster than it writes, so fudge this.
                    // Only write for changes >= 1%, otherwise, on large
                    // uploads, this can write thousands of lines into the
                    // logs.
                    let pctComplete = xfer.percentComplete() * 0.985;
                    if (pctComplete - lastPercentComplete > 1) {
                        uploader.info('status', Constants.OP_IN_PROGRESS,
                                      `${ss.name } - ${f} - ${pctComplete.toFixed(2)}%`,
                                      pctComplete, false);
                        lastPercentComplete = pctComplete;
                    }
                });
            });
            promises.push(promise);
            provider.upload(filepath, path.basename(filepath));
        }
        return promises;
    }

    /**
     * This checks to ensure that the {@link UploadOperation} includes a
     * target and at least one source file. It also ensures that the
     * specified source files exist. It returns an array of strings decribing
     * the validation errors.
     *
     * @return {Array<string>}
     */
    validateParams() {
        let errors = [];
        for (let op of this.job.uploadOps) {
            let opErrors = []
            if (Util.isEmpty(op.storageServiceId)) {
                opErrors.push(Context.y18n.__('Specify where you want to upload the file.'));
            }
            if (!op.sourceFiles || Util.isEmptyStringArray(op.sourceFiles)) {
                opErrors.push(Context.y18n.__('Specify at least one file to upload.'));
            }
            for (let f of op.sourceFiles) {
                if (!fs.existsSync(f)) {
                    opErrors.push(Context.y18n.__(`File to be uploaded does not exist: %s.`, f));
                }
            }
            if (opErrors.length > 0) {
                let providerDesc = 'Unknown upload provider';
                try {
                    let ss = StorageService.find(op.storageServiceId);
                    let providerClass = this.getProvider(ss.protocol)
                    providerDesc = providerClass.description().name;
                } catch (err) {
                    providerDesc += ` ${err.message}`;
                }
                let result = new OperationResult('upload', providerDesc);
                result.start();
                result.finish(opErrors.join(' '));
                op.results.push(result);
                errors = errors.concat(opErrors);
            }
        }
        return errors;
    }

    /**
     * This returns the first network provider plugin that implements the
     * S3 protocol. If it can't find a plugin for the S3 protocol, it throws
     * an exception.
     *
     * @returns {Plugin}
     */
    getProvider(protocol) {
        let providers = PluginManager.implementsProtocol(protocol);
        if (providers.length == 0) {
            throw `Cannot find a plugin that implements the ${protocol} protocol.`
        }
        return providers[0];
    }
}

module.exports.Uploader = Uploader;
