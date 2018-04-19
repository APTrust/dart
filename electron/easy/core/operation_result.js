const dateFormat = require('dateformat');
const { Util } = require('./util');

class OperationResult {
    constructor(operation, provider) {
        // operation should be either "Bagging" or "Storage"
        this.operation = operation;
        // provider is the name of the plugin performing the
        // operation.
        this.provider = provider;
        // filename of bag or item that was packaged or stored
        this.filename = "";
        // filesize is the size of the file that was packaged or stored
        this.filesize = 0;
        // fileMtime is the last-modified time of local bag (tar file).
        this.fileMtime = null;
        // remoteChecksum is the checksum returned by the remote
        // storage service after upload, if applicable. For S3 storage,
        // this will be the e-tag. For FTP transfers and bagging
        // operations, this will remain null.
        this.remoteChecksum = null;
        // remoteUrl is the location to which we sent a file.
        // This is set only on storage operations.
        this.remoteUrl = null;
        // attemptNumber is how many times we've attempted this operation
        this.attemptNumber = 0;
        // timestamp for started
        this.started = null;
        // timestamp for completed
        this.completed = null;
        // provider can set this
        this.succeeded = false;
        // info messages
        this.info = "";
        // warnings
        this.warning = ""
        // error messages
        this.error = "";
    }
    reset() {
        this.started = null;
        this.completed = null;
        this.succeeded = false;
        this.filename = "";
        this.filesize = 0;
        this.fileMtime = null;
        this.remoteUrl = '';
        this.remoteChecksum = '';
        this.info = "";
        this.warning = "";
        this.error = "";
    }
    summary() {
        if (this.operation == 'package') {
            return this._packageSummary();
        } else if (this.operation == 'storage') {
            return this._storageSummary();
        }
        return '';
    }
    _packageSummary() {
        let message = 'Packaging failed';
        if (this.completed) {
            let when = dateFormat(this.completed, 'shortDate') + " " + dateFormat(this.completed, 'shortTime');
            let size = Util.toHumanSize(this.filesize);
            if (this.succeeded) {
                message = `Packaged ${size} ${when}`
            } else {
                message += when;
            }
        }
        return message;
    }
    _storageSummary() {
        let message = 'Upload failed';
        if (this.completed) {
            let when = dateFormat(this.completed, 'shortDate') + " " + dateFormat(this.completed, 'shortTime');
            let size = Util.toHumanSize(this.filesize);
            if (this.succeeded) {
                // message = `Uploaded ${size} to ${this.remoteUrl} ${when}`
                message = `Uploaded ${when}`
                if (this.remoteChecksum) {
                    message += ` (etag: ${this.remoteChecksum})`
                }
            } else {
                message += when;
            }
        }
        return message;
    }
}

module.exports.OperationResult = OperationResult;
