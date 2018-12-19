const fs = require('fs');
const { OperationResult } = require('../../core/operation_result');

/**
 *
 */
class S3Transfer {
    // operation should be either 'upload' or 'download'
    constructor(operation, provider) {
        this.operation = operation;
        this.host = '';
        this.port = null;
        this.bucket = '';
        this.key = '';
        this.localPath = '';
        this.localStat = null;
        this.remoteStat = null;
        this.etag = '';
        this.error = null;
        this.result = new OperationResult(operation, provider);
    }

    getRemoteUrl() {
        let url = 'https://' + this.host.replace('/','');
        if (this.port) {
            url += `:${this.port}`;
        }
        url += `/${this.bucket}/${this.key}`;
        return url;
    }

}

module.exports.S3Transfer = S3Transfer;
