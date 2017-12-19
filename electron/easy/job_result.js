class JobResult {
	constructor(operation) {
		// operation should be either "Bagging" or "Storage"
		this.operation = operation;
		this.attemptNumber = 1;
		this.started = null;
		this.completed = null;
		this.succeeded = false;
		// stdout & stderr captured from external program
		this.stdout = "";
		this.stderr = "";
	}
}
