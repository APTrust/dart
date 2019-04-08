const { Constants } = require('../core/constants');
const fs = require('fs');
const path = require('path');
const { OperationResult } = require('../core/operation_result');
const { PluginManager } = require('../plugins/plugin_manager');
const { UploadTarget } = require('../core/upload_target');
const { Util } = require('../core/util');

class Uploader {

    constructor(job) {
        this.job = job;
        this.exitCode = Constants.EXIT_SUCCESS;
    }

    run() {
        this.validateParams();
        let promises = [];
        for (let op of this.job.uploadOps) {
            promises = promises.concat(this.doUpload(op));
        }
        return Promise.all(promises)
    }

    doUpload(uploadOp) {
        let uploadTarget = UploadTarget.find(uploadOp.uploadTargetId);
        if (!uploadTarget) {
            throw 'Cannot find UploadTarget record'
        }
        let providerClass = this.getProvider(uploadTarget.protocol);
        let promises = [];
        for (let filepath of uploadOp.sourceFiles) {
            // this.initOperationResult(uploadOp, provider, uploadTarget, filepath);
            let provider = new providerClass(uploadTarget);
            var promise = new Promise(function(resolve, reject) {
                provider.on('start', function(result) {
                    console.log('Upload started');
                });
                provider.on('finish', function(result) {
                    uploadOp.result = result;
                    console.log('Finished');
                    resolve(result);
                });
                provider.on('error', function(result) {
                    // Reject causes the entire Promise.all chain
                    // to fail. We want to let other pending promises
                    // complete instead of stopping the chain. We will
                    // handle retries elsewhere.
                    uploadOp.result = result;
                    console.log('Error');
                    resolve(result);
                });
                provider.on('warning', function(xferResult) {
                    Context.logger.warning(xferResult.warning);
                });
            });
            promises.push(promise);
            provider.upload(filepath, path.basename(filepath));
        }
        return promises;
    }

    validateParams() {
        for (let op of this.job.uploadOps) {
            if (Util.isEmpty(op.uploadTargetId)) {
                throw 'Specify where you want to upload the file.'
            }
            if (!op.sourceFiles || Util.isEmptyStringArray(op.sourceFiles)) {
                throw 'Specify at least one file to upload.'
            }
            for (let f of op.sourceFiles) {
                if (!fs.existsSync(f)) {
                    throw `File to be uploaded does not exist: ${f}.`
                }
            }
        }
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
