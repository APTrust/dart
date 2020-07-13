const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Workflow } = require('./workflow');

class WorkflowBatch extends PersistentObject {

    constructor(opts = {}) {
        super(opts);
        this.workflowId = opts.workflowId;
        this.pathToCSVFile = opts.pathToCSVFile;
        this.succeeded = [];
        this.failed = {};
    }

}

module.exports.WorkflowBatch = WorkflowBatch;
