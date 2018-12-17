const fs = require('fs');
const { OperationResult } = require('../../core/operation_result');

class S3Transfer {
    // operation should be either 'upload' or 'download'
    constructor(operation, provider) {
        this.bucket = '';
        this.key = '';
        this.localPath = '';
        this.operation = operation;
        this.localStat = null;
        this.remoteStat = null;
        this.etag = '';
        this.error = null;
        this.result = new OperationResult(operation, provider);
    }
}

module.exports.S3Transfer = S3Transfer;
