module.exports = class OperationResult {
	constructor(operation) {
		// operation should be either "Bagging" or "Storage"
		this.operation = operation;
        // filename of bag or item to be stored
        this.filename = "";
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
		this.info = "";
		this.warning = "";
		this.error = "";
    }
}
