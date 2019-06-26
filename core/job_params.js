const { BagItProfile } = require('../bagit/bagit_profile');
const { Job } = require('./job');
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
    }

    /**
     * Validates that the JobParams are complete.
     *
     */
    validate() {

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
}

module.exports.JobParams = JobParams;
