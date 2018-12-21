const CLI = require('./cli_constants');
const dateFormat = require('dateformat');
const { Job } = require('../core/job');
const path = require('path');
const { PluginManager } = require('../plugins/plugin_manager');
const { UploadOperation } = require('../core/upload_operation');
const { Util } = require('../core/util');

class S3Upload {

    constructor(opts) {
        this.opts = opts;
        this.exitCode = CLI.EXIT_SUCCESS;
    }

    run() {
        this.validateOpts();
        //let url = URL.parse(this.opts.dest);
        let provider = this.getProvider();
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
        if (this.opts.source.length < 1) {
            throw 'Specify at least one file to upload.'
        }
        if (this.opts.source.length > 1) {
            console.warn(`Multiple sources specified. Only ${this.opts.source[0]} will be uploaded.`);
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
        let op = new UploadOperation(this.opts.dest, 's3', [this.this.opts.source[0]]);
        op.result = new OperationResult();
        op.result.start();

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
     * return the service that contains the path name. Failing that, it will
     * return the first service with the matching host and protocol.
     *
     * @returns {StorageService} or null.
     */
    getStorageService() {
        let url = new URL(this.opts.dest);
        let exact = (obj) => { return obj.protocol == 's3' && obj.host == url.host && obj.bucket == url.pathname };
        let includes = (obj) => { return obj.protocol == 's3' && obj.host == url.host && url.pathname.includes(obj.bucket)};
        let hostMatches = (obj) => { return obj.protocol == 's3' && obj.host == url.host };
        return StorageService.first(exact) || StorageService.first(includes) || StorageService.first(host);
    }
}

module.exports = S3Upload;
