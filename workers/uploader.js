//const CLI = require('./cli_constants');
const dateFormat = require('dateformat');
const fs = require('fs');
//const { Job } = require('../core/job');
const path = require('path');
const { OperationResult } = require('../core/operation_result');
const { PluginManager } = require('../plugins/plugin_manager');
//const { UploadTarget } = require('../core/upload_target');
//const { UploadOperation } = require('../core/upload_operation');
const { Util } = require('../core/util');

class Uploader {

    constructor(job) {
        this.job = job;
        this.exitCode = CLI.EXIT_SUCCESS;
    }

    run() {
        this.validateOpts();
        for (let op of this.job.uploadOps) {
            this.doUpload(op);
        }
    }

    doUpload(uploadOp) {
        let uploadTarget = UploadTarget.find(uploadOp.uploadTargetId);
        if (!uploadTarget) {
            throw 'Cannot find UploadTarget record'
        }
        let provider = this.getProvider(uploadTarget.protocol);
        for (let filepath of uploadOp.sourceFiles) {
            this.initOperationResult(uploadOp, provider, uploadTarget, filepath);

            // START HERE
            // TODO: This emits a finish event.
            provider.upload(filepath, path.basename(filepath));
        }
    }

    initOperationResult(op, provider, target, filepath) {
        let stats = fs.statSynch(filepath);
        let result = new OperationResult('upload', provider.description().name);
        op.results.push(result);
        // Be careful because start() calls reset() internally,
        // clearing some of the attributes we set below. So call
        // start() first, then set attrs.
        // TODO: Smarter start()/reset() for this class?
        result.start();
        result.filepath = filepath;
        result.filesize = stats.size;
        result.fileMtime = dateFormat(stats.mtime, 'isoUtcDateTime');
        result.remoteURL = target.url(filepath);
    }

    validateParams() {
        for (let op of this.job.uploadOps) {
            if (Util.isEmpty(op.uploadTargetId)) {
                throw 'Specify where you want to upload the file.'
            }
            if (!op.sourceFiles || Util.isEmptyStringArray(op.source)) {
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
