const dateFormat = require('dateformat');

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
        this.info = "";
        this.warning = "";
        this.error = "";
    }
    summary() {
        var result = this;
        var op = result.operation[0].toUpperCase() + result.operation.slice(1);
        var outcome = '';
        var when = '';
        if (result.started) {
            if (result.succeeded) {
                outcome = 'succeeded';
            } else {
                outcome = 'failed';
            }
        }
        if (result.completed) {
            when = dateFormat(result.completed, 'shortDate') + " " + dateFormat(result.completed, 'shortTime');
        }
        return `${op} ${outcome} ${when}`
    }
}

module.exports.OperationResult = OperationResult;
