const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Job } = require('./job');
const { PackageOperation } = require('./package_operation');
const path = require('path');
const { UploadOperation } = require('./upload_operation');
const { Workflow } = require('./workflow');

/**
 * The JobParams class provides a way of converting a simple set of
 * parameters into a DART job. See the {@link JobParams#toJob} method
 * for details on how this small data structure is converted to a Job.
 *
 * @param {object} opts
 *
 * @param {string} opts.workflow - The name of the workflow to run. The
 * {@link JobParams#toJob} method will create a {@link Job} that includes
 * all of the components of the named Workflow, including packaging,
 * validation, and upload to one or more targets. Be sure to name an
 * existing {@link Workflow}, or you'll get an error when you call
 * {@link JobParams#toJob}.
 *
 * @param {string} [opts.packageName] - The name of the package/file
 * your job will create. This may be a tar or zip file. For example,
 * "virginia.edu.Photos_2019-06-26.tar", "pdfs.zip", etc. This parameter
 * is required if your job will be creating a package.
 *
 * @param {string} [opts.files] - An array of file paths. These are the
 * files that the job will be packaging and/or uploading. These should be
 * absolute paths.
 *
 * @param {Array<TagDefinition>} [opts.tags] - These are required only
 * if your job will be creating a package in BagIt, OCFL, or another
 * format that requires metadata in name-value pairs. These values will
 * be written into the package. Per the BagIt specification, repeated
 * tags (those with the same tagFile and tagName) will be written in the
 * same order in which they appear in the opts.tags array.
 *
 * @example
 *
 * let opts = {
 * 	workflow: "Name of Workflow",
 * 	packageName: "test.edu.my_files.tar",
 * 	files: [
 * 		"/path/to/first/directory",
 * 		"/path/to/second/directory",
 * 		"/path/to/some/document.pdf"
 * 	],
 * 	tags: [
 * 		{
 * 			"tagFile": "bag-info.txt",
 * 			"tagName": "Bag-Group-Identifier",
 * 			"userValue": "Photos_2019"
 * 		},
 * 		{
 * 			"tagFile": "aptrust-info.txt",
 * 			"tagName": "Title",
 * 			"userValue": "Photos from 2019"
 * 		},
 * 		{
 * 			"tagFile": "aptrust-info.txt",
 * 			"tagName": "Description",
 * 			"userValue": "What I did with my summer vacation."
 * 		},
 * 		{
 * 			"tagFile": "custom/legal-info.txt",
 * 			"tagName": "License",
 * 			"userValue": "https://creativecommons.org/publicdomain/zero/1.0/"
 * 		}
 * 	]
 * }
 *
 * let jobParams = new JobParams(opts);
 *
 * // Create a job and save it to the DART Jobs database.
 * let job = jobParams.toJob();
 * job.save();
 *
 * // Or just write the job directly to a JSON file.
 * jobParams.toJobFile("/tmp/dart/job_file.json");
 */
class JobParams {
    constructor(opts = {}) {
        /**
         * The name of the workflow. This workflow will provide the
         * template for the job.
         *
         * @type {string}
         */
        this.workflow = opts.workflow;
        /**
         * The name of the package or output file to create.
         *
         * @type {string}
         */
        this.packageName = opts.packageName;
        /**
         * A list of files to package and/or upload. These should be
         * absolute paths.
         *
         * @type {Array<string>}
         */
        this.files = opts.files;
        /**
         * A list of metadata tags to include in the package.
         *
         * @type {Array<TagDefinition>}
         */
        this.tags = opts.tags;


        this._workflowObj = null;

        this._bagItProfile = null;

        this.errors = {};
    }

    /**
     * Converts the JobParams to a {@link Job} object, which DART can then
     * run. This performs the following operations to create a job:
     *
     * 1. Loads the {@link Workflow} speficied in this.workflow.
     *
     * 2. Creates a {@link Job} object patterned after that Workflow.
     *
     * 3. Copies the packageName and files (if specified) into the new
     *    {@link Job} object.
     *
     * 4. If the {@link Workflow} includes a {@link BagItProfile}, this
     *    copies this.tags into a copy of that {@link BagItProfile}.
     *    Typically, most tag values in a DART {@link BagItProfile}, such
     *    as "Source-Organization", "Contact-Email", etc. are set to
     *    default values because they do not change from one bag to the
     *    next. More specific values, such as "Title", "Description", or
     *    "Internal-Sender-Identifier" do change from bag to bag. The
     *    {@link JobParams#tags} property allows you to overwrite
     *    bag-specific tag values withouth having to re-specify any
     *    default tag values. Any values you specify in {@link JobParams#tags}
     *    will overwrite tag values in the job-specific copy of the
     *    {@link BagItProfile}.
     *
     * @returns {@link Job}
     */
    toJob() {
        if (!this._getWorkflow()) {
            return null;
        }
        if (!this._getBagItProfile()) {
            return null;
        }
        let job = new Job();

        // Call job.validate before returning.
    }

    validate() {
        // If packageName, then files are required.
        // If packageName, then packageFormat is required.
        // If packageFormat requires a plugin, then pluginId required.
    }

    /**
     * This does the same as {@link JobParams#toJob}, but instead of
     * returning the Job object, it writes it as JSON to the specified
     * file.
     *
     * @param {string} pathToFile - The path to the file where you want
     * to write a JSON description of this job.
     *
     */
    toJobFile(pathToFile) {

    }

    _getWorkflow() {
        this._workflowObj = Workflow.firstMatching('name', this.workflow);
        if (!this._workflowObj) {
            this.errors['workflow'] = Context.y18n.__('Cannot find workflow %s', this.workflow);
            return false;
        }
        return true;
    }

    _getBagItProfile() {
        if (this._workflowObj.bagItProfileId) {
            this._bagItProfile = BagItProfile.find(this._workflowObj.bagItProfileId);
            if (!bagItProfile) {
                this.errors['bagItProfile'] = Context.y18n.__("Could not find BagItProfile with id %s", this._workflowObj.bagItProfileId);
                return false;
            }
        }
        return true;
    }

    _buildJob() {
        // Note: No need to create job.validationOp. The JobRunner will
        // create that if the package format is BagIt and the package was
        // successfully created. See workers/job_runner.js#createPackage().
        let job = new Job();
        job.name = this._workflowObj.packageName || Job.genericName();
        job.bagItProfile = this._bagItProfile;
        this._makePackageOp(job);
        this._makeUploadOps(job);
        return job;
    }

    _makePackageOp(job) {
        if (this.packageName) {
            let outputPath = this._getOutputPath();
            job.packageOp = new PackageOperation(this.packageName, outputPath);
            job.packageOp.packageFormat = this._workflowObj.packageFormat;
            job.packageOp.pluginId = this._workflowObj.packagePluginId;
            job.packageOp.sourceFiles = this._workflowObj.files;
        }
    }

    _makeUploadOps(job) {
        if (!this._workflowObj.storageServiceIds || this._workflowObj.storageServiceIds.length == 0) {
            // No storage services specified, so no uploads to perform.
            return;
        }
        let files = [];
        if (job.packageOp && job.packageOp.outputPath) {
            // We want to upload the result of the package operation.
            files = [job.packageOp.outputPath];
        } else {
            // No packaging step. We want to upload the files themselves.
            files = this.files;
        }
        for (let ssid of this._workflowObj.storageServiceIds) {
            job.uploadOps.push(new UploadOperation(ssid, files));
        }
    }

    _getOutputPath() {
        let outputPath = null;
        if (this.packageName) {
            let outputDir = AppSetting.firstMatching('name', 'Bagging Directory').value;
            outputPath = path.join(outputDir, this.packageName);
        }
        return outputPath;
    }

}

module.exports.JobParams = JobParams;
