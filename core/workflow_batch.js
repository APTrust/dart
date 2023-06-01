const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const { CSVBatchParser } = require('../util/csv_batch_parser');
const fs = require('fs');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');
const { Workflow } = require('./workflow');

class WorkflowBatch extends PersistentObject {

    constructor(opts = {}) {
        opts.required = ['workflowId', 'pathToCSVFile'];
        super(opts);
        this.workflowId = opts.workflowId;
        this.pathToCSVFile = opts.pathToCSVFile;
        this.jobParamsArray = [];
        this.errors = {};
    }

    /**
     * Validate the WorkflowBatch, ensuring that the workflow exists
     * and the CSV file contains valid and complete data. Note that
     * validation triggers CSV parsing. After you call this method,
     * this.jobParamsArray will be populated. Check to ensure this returns
     * true before executing the batch because jobParamsArray may contain
     * valid or invalid data. If this returns false, this.errors will
     * contain a list of specific errors.
     *
     */
    validate() {
        this.errors = {};
        super.validate();
        if (!this.validateWorkflow()) {
            Context.logger.error(this.errors);
            return false;
        }
        if (!this.validateCSVFile()) {
            Context.logger.error(this.errors);
            return false;
        }
        Context.logger.error(this.errors);
        return Object.keys(this.errors).length == 0;
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
            this.jobParamsArray = parser.parseAll();
            this.checkPaths(this.jobParamsArray);
            this.checkRequiredTags(this.jobParamsArray);
        } catch (ex) {
            Context.logger.error(ex);
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
        let lineNumber = 2;
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
        if (workflow == null) {
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
        for (let i=0; i < jobParamsArray.length; i++) {
            let params = jobParamsArray[i];
            for (let tag of profile.tags) {
                if (tag.tagFile == 'bagit.txt') {
                    continue;
                }
                let tagName = `${tag.tagFile}/${tag.tagName}`;
                let lineNumber = (i + 2).toString();
                let key = `${lineNumber}-${tagName}`
                let paramTags = params.tags.filter((pt) => pt.tagFile == tag.tagFile && pt.tagName == tag.tagName);
                let paramTag = null;
                if (paramTags.length > 0) {
                    paramTag = paramTags[0];
                }
                if (tag.required && paramTag == null) {
                    this.errors[key] = Context.y18n.__("Required tag %s on line %s is missing", tagName, lineNumber);
                } else if (tag.required && (paramTag.userValue == null || paramTag.userValue.toString().trim() == '')) {
                    this.errors[key] = Context.y18n.__("Required tag %s on line %s has empty value", tagName, lineNumber);
                } else if (tag.values.length > 0 && !Util.listContains(tag.values, paramTag.userValue)) {
                    this.errors[key] = Context.y18n.__("Value %s for tag %s on line %s is not in the list of allowed values.", paramTag.userValue, paramTag.tagName, lineNumber);
                }
            }
        }
    }
}


module.exports.WorkflowBatch = WorkflowBatch;
