const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const { CSVBatchParser } = require('../util/csv_batch_parser');
const fs = require('fs');
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
            let workflow = this.getWorkflow();
            let parser = new CSVBatchParser({
                pathToFile: this.pathToCSVFile,
                workflowName: workflow.name,
            });
            let jobParamsArray = parser.parseAll();
            this.checkPaths(jobParamsArray);
            this.checkRequiredTags(jobParamsArray);
        } catch (ex) {
            Context.logger.error(ex);
            console.error(ex);
            this.errors['csvFile'] = ex.message;
        }
        return Object.keys(this.errors).length == 0;
    }

    getWorkflow() {
        let workflow = Workflow.find(this.workflowId)
        if (workflow == null) {
            this.errors['workflow'] = Context.y18n.__('DART cannot find the workflow you want to run.');
        } else if (workflow.validate() == false) {
            this.errors = workflow.errors;
            this.errors['workflow'] = Context.y18n.__('Workflow has missing or invalid attributes');
            Context.logger.error(JSON.stringify(this.errors));
        }
        return workflow;
    }

    checkPaths(jobParamsArray) {
        let lineNumber = 1;
        for (let params of jobParamsArray) {
            for (let filePath of params.files) {
                if (!fs.existsSync(filePath)) {
                    this.errors[filePath] = Context.y18n.__("Line %s: path does not exist: %s", lineNumber.toString(), filePath);
                }
            }
            lineNumber++;
        }
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
        this._checkTagsRequiredByProfile(profile, jobParamsArray);
    }

    _checkTagsRequiredByProfile(profile, jobParamsArray) {
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
