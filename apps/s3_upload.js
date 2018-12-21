const CLI = require('./cli_constants');
const dateFormat = require('dateformat');
const fs = require('fs');
const { Job } = require('../core/job');
const path = require('path');
const { OperationResult } = require('../core/operation_result');
const { PluginManager } = require('../plugins/plugin_manager');
const { StorageService } = require('../core/storage_service');
const { UploadOperation } = require('../core/upload_operation');
const { Util } = require('../core/util');

class S3Upload {

    constructor(opts) {
        this.opts = opts || {};
        this.exitCode = CLI.EXIT_SUCCESS;
    }

    run() {
        this.validateOpts();
        // 'let op' = 'pay attention' in Nederlands
        let op = this.initOpRecord();
        try {

        } catch (err) {

        }
    }

    /**
     * This validates the options passed in from the command line. If the
     * source or destination is missing, this will throw an exception.
     *
     */
    validateOpts() {
        if (!this.opts.source || this.opts.source.length < 1 || Util.isEmpty(this.opts.source[0])) {
            throw 'Specify at least one file to upload.'
        }
        if (this.opts.source.length > 1) {
            console.warn(`Multiple sources specified. Only ${this.opts.source[0]} will be uploaded.`);
        }
        if (!fs.existsSync(this.opts.source[0])) {
            throw `File does not exist: ${this.opts.source[0]}.`
        }
        if (!this.opts.dest) {
            throw 'Specify where you want to upload the file.'
        }
    }

    /**
     * This returns a fully initialized {@link UploadOperation} record that
     * will be used as a manifest to describe what work the uploader did and
     * what the outcome was.
     *
     * @returns {UploadOperation}
     */
    initOpRecord() {
        let stats = fs.statSync(this.opts.source[0]);
        let provider = this.getProvider();
        let storageService = this.getStorageService();
        let op = new UploadOperation(this.opts.dest, 's3', [this.opts.source[0]]);
        op.result = new OperationResult('upload', provider.description().name);
        // Be careful because start() calls reset() internally,
        // clearing some of the attributes we set below. So call
        // start() first, then set attrs.
        // TODO: Smarter start()/reset() for this class?
        op.result.start();
        op.result.filepath = this.opts.source[0];
        op.payloadSize = op.result.filesize = stats.size;
        op.result.fileMtime = dateFormat(stats.mtime, 'isoUtcDateTime');
        op.result.remoteURL = this.opts.dest;
        return op;
    }

    /**
     * This returns the first network provider plugin that implements the
     * S3 protocol. If it can't find a plugin for the S3 protocol, it throws
     * an exception.
     *
     * @returns {Plugin}
     */
    getProvider() {
        let providers = PluginManager.implementsProtocol('s3');
        if (providers.length == 0) {
            throw 'Cannot find a plugin that implements the s3 protocol.'
        }
        return providers[0];
    }

    /**
     * This returns the first StorageService record that implements the S3
     * protocol and matches the hostname of the URL specified in this.opts.dest.
     * It will return the StorageService whose bucket property exactly matches
     * the URL's pathname, if there is such a service. Failing that, it will
     * return the service whose bucket starts with the path name. Failing that,
     * it will return the first service with the matching host and protocol.
     *
     * @returns {StorageService} or null.
     */
    getStorageService() {
        let url = new URL(this.opts.dest);
        let exact = (obj) => { return obj.protocol == 's3' && obj.host == url.host && obj.bucket == url.pathname };
        let includes = (obj) => { return obj.protocol == 's3' && obj.host == url.host && !Util.isEmpty(obj.bucket) && url.pathname.startsWith('/'+obj.bucket)};
        let hostMatches = (obj) => { return obj.protocol == 's3' && obj.host == url.host };
        let storageService = StorageService.first(exact) || StorageService.first(includes) || StorageService.first(hostMatches);
        if (!storageService) {
            throw `Cannot find a StorageService record for ${url.host}.`;
        }
        return storageService;
    }
}

module.exports = S3Upload;
