const { Context } = require('./context');
const { CSVBatchParser } = require('../util/csv_batch_parser');
const { PersistentObject } = require('./persistent_object');
const { Workflow } = require('./workflow');

class WorkflowBatch extends PersistentObject {

    constructor(opts = {}) {
        opts.required = ['workflowId', 'pathToCSVFile'];
        super(opts);
        this.workflowId = opts.workflowId;
        this.pathToCSVFile = opts.pathToCSVFile;
        this.errors = {};
    }

    validate() {
        this.errors = {};
        super.validate();
        // if (!this.validateWorkflow()) {
        //     Context.logger.error(this.errors);
        //     return false;
        // }
        // if (!this.validateCSVFile()) {
        //     Context.logger.error(this.errors);
        //     return false;
        // }
        // Context.logger.error(this.errors);
        // return Object.keys(this.errors).length == 0;
    }

    validateWorkflow() {
        let throwaway = this.getWorkflow()
        return Object.keys(this.errors).length == 0;
    }

    validateCSVFile() {
        try {
            let parser = new CSVBatchParser({
                pathToFile: this.pathToCSVFile,
                workflowName: this.workflow.name,
            });
            let jobParamsArray = parser.parseAll();
            this.checkRequiredTags(jobParamsArray);
        } catch (ex) {
            Context.logger.error(ex);
            this.errors['csvFile'] = ex.message;
        }
        return Object.keys(this.errors).length == 0;
    }

    getWorkflow() {
        let workflow = Workflow.find(this.workflowId)
        if (worflow == null) {
            this.errors['workflow'] = Context.y18n.__('DART cannot find the workflow you want to run.');
        } else if (workflow.validate() == false) {
            this.errors = workflow.errors;
        }
        return workflow;
    }

    checkRequiredTags(jobParamsArray) {
        let workflow = this.getWorkflow();
        if (Object.keys(this.errors).length > 0) {
            return false;
        }
        let profile = BagItProfile.find(workflow.bagItProfileId);
        if (profile == null) {
            this.errors['bagItProfile'] = Context.y18n.__("Cannot find BagIt profile for workflow '%s'", workflow.name);
            return false;
        }
        this._checkTagsRequiredByProfile(profile);
    }

    _checkTagsRequiredByProfile(profile) {
        // Get a list of required tags whose values must appear in the CSV file.
        let requiredTags = profile.tags.filter((t) => t.required && t.defaultValue == '' && !t.systemMustSet());
        for (let i=0; i < jobParamsArray.length; i++) {
            let params = jobParamsArray[i];
            for (let requiredTag of requiredTags) {
                let paramTag = params.tags.filter((pt) => pt.tagFile == requireTag.tagFile && pt.tagName == requiredTag.tagName);
                let tagName = `${requiredTag.tagFile}/${requiredTag.tagname}`;
                let lineNumber = (i + 1).toString();
                if (paramTag == null) {
                    this.errors[tagName] = Context.y18n.__("Required tag %s on line %s is missing", tagName, lineNumber);
                } else if (paramTag.userValue == null || paramTag.userValue.toString().trim() == '') {
                    this.errors[tagName] = Context.y18n.__("Required tag %s on line %s has empty value", tagName, lineNumber);
                }
            }
        }
    }
}

module.exports.WorkflowBatch = WorkflowBatch;
