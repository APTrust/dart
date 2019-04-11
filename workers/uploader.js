const { Constants } = require('../core/constants');
const fs = require('fs');
const path = require('path');
const { OperationResult } = require('../core/operation_result');
const { PluginManager } = require('../plugins/plugin_manager');
const { UploadTarget } = require('../core/upload_target');
const { Util } = require('../core/util');
const { Worker } = require('./worker');

class Uploader extends Worker {

    constructor(job) {
        super('upload')
        this.job = job;
    }

    run() {
        let errors = this.validateParams();
        if (errors.length > 0) {
            return this.validationError(errors);
        }
        let promises = [];
        for (let op of this.job.uploadOps) {
            promises = promises.concat(this.doUpload(op));
        }
        return Promise.all(promises)
    }

    doUpload(uploadOp) {
        let uploadTarget = UploadTarget.find(uploadOp.uploadTargetId);
        if (!uploadTarget) {
            return this.runtimeError('preUpload', ['Cannot find UploadTarget record'], null);
        }
        let providerClass = this.getProvider(uploadTarget.protocol);
        let promises = [];
        let uploader = this;
        for (let filepath of uploadOp.sourceFiles) {
            let provider = new providerClass(uploadTarget);
            var promise = new Promise(function(resolve, reject) {
                provider.on('start', function(result) {
                    uploader.info('start',
                                  Constants.OP_IN_PROGRESS,
                                  uploadTarget.url(path.basename(filepath)),
                                  false);
                });
                provider.on('finish', function(result) {
                    uploadOp.result = result;
                    if (result.errors.length > 0) {
                        uploader.completedWithError(result.errors);
                    } else {
                        uploader.completedSuccess(uploadTarget.url(path.basename(filepath)), false);
                    }
                    resolve(result);
                });
                provider.on('error', function(result) {
                    // Reject causes the entire Promise.all chain
                    // to fail. We want to let other pending promises
                    // complete instead of stopping the chain. We will
                    // handle retries elsewhere.
                    uploadOp.result = result;
                    uploader.runtimeError('upload', result.errors);
                    resolve(result);
                });
                provider.on('warning', function(xferResult) {
                    uploader.info('upload', Constants.OP_IN_PROGRESS,
                                  xferResult.warning, false);
                });
            });
            promises.push(promise);
            provider.upload(filepath, path.basename(filepath));
        }
        return promises;
    }

    validateParams() {
        let errors = [];
        for (let op of this.job.uploadOps) {
            if (Util.isEmpty(op.uploadTargetId)) {
                errors.push(Context.y18n.__('Specify where you want to upload the file.'));
            }
            if (!op.sourceFiles || Util.isEmptyStringArray(op.sourceFiles)) {
                errors.push(Context.y18n.__('Specify at least one file to upload.'));
            }
            for (let f of op.sourceFiles) {
                if (!fs.existsSync(f)) {
                    errors.push(Context.y18n.__(`File to be uploaded does not exist: ${f}.`));
                }
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
