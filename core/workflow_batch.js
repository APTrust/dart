const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const { CSVBatchParser } = require('../util/csv_batch_parser');
const fs = require('fs');
const { JobParams } = require('./job_params');
const path = require('path')
const { PersistentObject } = require('./persistent_object');
const { SimpleLineParser } = require('../util/simple_line_parser');
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
        let workflow = this.getWorkflow()
        if (Object.keys(this.errors).length > 0) {
            Context.logger.error(this.errors);
            return false;
        }
        // If this is a non-bagging job, our batch file
        // only needs to contain a list of file paths.
        // Make sure they exist.
        if (workflow.skipBagCreation) {            
            if (!this.parseNonBaggingBatchFile()) {
                Context.logger.error(this.errors);
                return false;    
            }
        } else if (!this.validateCSVFile()) {
            // Otherwise, this workflow creates bags. We need
            // to verify that the CSV file defines what to bag
            // and contains a complete and valid set of tag
            // info for each bag we'll create.
            Context.logger.error(this.errors);
            return false;
        }
        Context.logger.error(this.errors);
        return Object.keys(this.errors).length == 0;
    }

    /**
     * Call this to ensure the workflow is valid. If this returns
     * false, check WorkflowBatch.errors for a list of problems.
     * 
     * @returns {boolean} True or false, indicating whether
     * the bag is valid.
     */
    validateWorkflow() {
        let throwaway = this.getWorkflow()
        return Object.keys(this.errors).length == 0;
    }


    /**
     * Parse a batch file for a non-bagging workflow. This 
     * should be a plain text file containing one path per
     * line. Each path should point to a bag, which can be
     * a tar file or a directory.
     * 
     * Check the value of WorkflowBatch.errors after this
     * call. The errors hash will tell you which, if any,
     * paths are bad.
     * 
     * 
     * @returns {boolean} Returns true if parsing succeeded
     * and all paths exist; false otherwise.
     */
    parseNonBaggingBatchFile() {
        let workflow = this.getWorkflow()
        try {
            let parser = new SimpleLineParser(this.pathToCSVFile)
            let bagPaths = parser.getLines(true)
            let lineNumber = 0
            bagPaths.forEach(function (bagPath) {
                lineNumber++
                if (!fs.existsSync(bagPath)) {
                    this.errors[bagPath] = Context.y18n.__("Line %s: path does not exist: %s", lineNumber.toString(), bagPath);
                    return
                }
                let packageName = path.basename(bagPath)
                if (Util.isDirectory(bagPath)) {
                    packageName = path.dirname(bagPath)
                }
                let jobParams = new JobParams({
                    workflowName: workflow.Name,
                    packageName: packageName,
                    files: [bagPath]
                })
                this.jobParamsArray.push(jobParams)
            })
        } catch (ex) {
            this.errors['batchFile'] = ex.toString()
        }
        return Object.keys(this.errors).length == 0
    }

    /**
     * This call is for workflows that create bags. It parses the CSV
     * file that describes the batch of bags to be created. It ensures that
     * for each bag mentioned in the CSV file, we have a bag name, a directory
     * name (the directory of files to bag up), and a complete and valid set
     * of required tags. The BagIt profile determines which tags are required
     * and what values are valid for each tag.
     * 
     * For non-bagging workflows, see {@link parseNonBaggingBatchFile}.
     * 
     * @returns {boolean} True or false, indicating whether all entries
     * in the CSV file contain sufficient info to run this workflow. 
     */
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

    /**
     * This returns the workflow with the ID specified in WorkflowBatch.workflowId.
     * Check the contents of WorkflowBatch.errors after this call. If there's no
     * such workflow, or if the workflow is invalid, the errors hash will describe
     * specific problems. 
     * 
     * @returns {Workflow}
     */
    getWorkflow() {
        let workflow = Workflow.find(this.workflowId)
        if (!workflow) {
            this.errors['workflow'] = Context.y18n.__('DART cannot find the workflow you want to run.');
        } else if (workflow.validate() == false) {
            this.errors = workflow.errors;
            this.errors['workflow'] = Context.y18n.__('Workflow has missing or invalid attributes');
            Context.logger.error(JSON.stringify(this.errors));
        }
        return workflow;
    }

    /**
     * This checks to ensure that all paths to existing bags or
     * files-to-be-bagged in the JobParams array actually exist.
     * Check the contents of WorkflowBatch.errors after this call
     * to see which paths are missing/non-existent.
     * 
     * @param {Array<JobParams} 
     */
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

    /**
     * This checks that tags required by this workflow's BagIt profile
     * are present in the job params read in from the CSV file.
     * 
     * Check the value of WorkflowBatch.errors after calling this to see
     * a hash of specific problems, if there are any. 
     * 
     * This call is not required for non-bagging jobs.
     * 
     * @param {Array<JobParams>} jobParamsArray
     * 
     */
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

    /**
     * This checks that tags required by this workflow's BagIt profile
     * are present in the job params read in from the CSV file and that
     * they contain valid values.
     * 
     * Check the value of WorkflowBatch.errors after calling this to see
     * a hash of specific problems, if there are any. 
     * 
     * This call is not required for non-bagging jobs.
     * 
     * @param {Array<JobParams>} jobParamsArray
     * 
     */
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
