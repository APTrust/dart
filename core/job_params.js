const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const fs = require('fs');
const { Job } = require('./job');
const { PackageOperation } = require('./package_operation');
const path = require('path');
const { TagDefinition } = require('../bagit/tag_definition');
const { UploadOperation } = require('./upload_operation');
const { Workflow } = require('./workflow');

/**
 * The JobParams class provides a way of converting a simple set of
 * parameters into a DART job. See the {@link JobParams#toJob} method
 * for details on how this small data structure is converted to a Job.
 *
 * @param {object} opts
 *
 * @param {string} opts.workflowName - The name of the workflow to run. The
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
 * 	workflowName: "Name of Workflow",
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
        this.workflowName = opts.workflowName;
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
        this.tags = opts.tags || [];
        /**
         * A copy of the {@link Workflow} object whose name matches
         * this.workflowName. This is private, for internal use only.
         *
         * @private
         * @type {Workflow}
         */
        this._workflowObj = null;
        /**
         * A copy of the {@link BagItProfile} object whose id matches
         * this._workflowObj.bagItProfileId. This is private, for internal
         * use only.
         *
         * @private
         * @type {BagItProfile}
         */
        this._bagItProfile = null;
        /**
         * A hash of validation errors for this JobParams object. Keys
         * are the names of invalid properies. Values are error messages
         * (strings) describing why the field is invalid.
         *
         * @type {object.<string, string>}
         */
        this.errors = {};
    }

    /**
     * Converts the JobParams to a {@link Job} object, which DART can then
     * run. This performs the following operations to create a job:
     *
     * 1. Loads the {@link Workflow} speficied in this.workflowName.
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
        if (!this._loadWorkflow()) {
            return null;
        }
        if (!this._loadBagItProfile()) {
            return null;
        }
        // Call job.validate before returning?
        return this._buildJob();
    }

    /**
     * Validates this JobParams object to ensure it can build a valid
     * job.
     *
     * THIS IS NOT YET IMPLEMENTED.
     *
     */
    validate() {
        // If packageName, then files are required.
        // If packageName, then packageFormat is required.
        // If packageFormat requires a plugin, then pluginId required.
    }

    /**
     * Merge tags from this.tags into the Job's copy of the BagItProfile.
     * Note that this.tags may include 1..N instances of a tag that is
     * defined 1 time in the BagItProfile. In those cases, this merge function
     * ensures that all values from this.tags will be copied, and that
     * any validation constraints on the original {@link TagDefinition} in
     * the {@link BagItProfile} will be copied to all instances of the tag.
     * Those constraints include the "required" attribute and the list of
     * valid values in the "values" attribute.
     *
     * @param {Job}
     */
    _mergeTags(job) {
        if (!job.bagItProfile) {
            return;
        }
        for(let tags of Object.values(this._groupedTags())) {
            // Every tag in this list will have the same tagFile and tagName.
            let firstTag = tags[0];
            //let indices = this._getTagIndices(job.bagItProfile, firstTag.tagFile, firstTag.tagName);
            let profileTags = job.bagItProfile.tags.filter(tag => tag.tagFile == firstTag.tagFile && tag.tagName == firstTag.tagName);
            this._mergeTagSet(job.bagItProfile, tags, profileTags);
        }
    }

    /**
     * Merges one or more values from this.tags into job.bagItProfile.tags.
     * Note the following behaviors:
     *
     * 1. If tags contains one tag with tagFile "bag-info.txt" and
     *    tagName "My-Tag", and profileTags also has one tag with that
     *    tagFile and tagName, the userValue from the tags version will
     *    be copied into the userValue from the profileTags version.
     *    That latter version persists in bag.bagItProfile.tags.
     *    When it's time to create the bag, the value will be copied
     *    from bag.bagItProfile.tags into the tag file.
     *
     * 2. If tags and profileTags each contain multiple copies of a tag
     *    with a given tagFile/tagName combination, all userValues from
     *    tags will be copied into the corresponding profileTags.
     *
     * 3. If tags contains more copies of a tag than are defined in
     *    profileTags, this method will add new tags to profileTags,
     *    each with a userValue copied from tags.
     *
     * @param {BagItProfile} bagItProfile - The job.bagItProfile object
     * into which you want to merge tags. Tags in the job's copy of the
     * BagItProfile will have their userValue property updated with the
     * userValue from matching items in the tags list. Items in the tags
     * list that do not exist in the bagItProfile will be added.
     *
     * @param {Array<object>} tags - A list of tags from this JobParams
     * object that have the same tagFile and tagName attributes.
     *
     * @param {Array<TagDefinition>} profileTags - A list of tags from
     * the job.bagItProfile.tags list that have the same tagFile and
     * tagName properties as those in the tags list (second param).
     *
     */
    _mergeTagSet(bagItProfile, tags, profileTags) {
        let firstInstanceOfTag = null;
        for (let i = 0; i < tags.length; i++) {
            let tag = tags[i];
            if (profileTags.length > i) {
                let tagInProfile = profileTags[i];
                if (!firstInstanceOfTag) {
                    // If this tag definition exists in the BagItProfile,
                    // keep a copy of it for use in the else clause
                    // below. The tag definition may include important
                    // validation info, such as whether a value is
                    // required and which values are legal.
                    firstInstanceOfTag = tagInProfile;
                }
                tagInProfile.userValue = tag.userValue;
            } else {
                // We have more instances of the tag specified
                // in our .tags array than in the BagItProfile.
                // This is allowed. Just append the new values
                // in order, per the BagIt spec (which says order
                // may be important).
                let newTag = new TagDefinition();
                let origId = newTag.id;
                if (firstInstanceOfTag) {
                    Object.assign(newTag, firstInstanceOfTag);
                    newTag.id = origId;
                } else {
                    newTag.tagFile = tag.tagFile;
                    newTag.tagName = tag.tagName;
                }
                newTag.userValue = tag.userValue;
                bagItProfile.tags.push(newTag);
            }
        }
    }

    /**
     * Returns an object in which tags having the same
     * tagFile and tagName are grouped. The order of the tags within
     * each group is preserved. The key to each object is tagFile/tagName
     * and the value is a list of tags having that tagFile and tagName.
     *
     * @returns {object}
     */
    _groupedTags() {
        let groupedTags = {};
        for (let tag of this.tags) {
            let key = tag.tagFile + ':' + tag.tagName;
            if (key in groupedTags === false) {
                groupedTags[key] = [];
            }
            groupedTags[key].push(tag)
        }
        return groupedTags;
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
        let job = this.toJob();
        fs.writeFileSync(pathToFile, JSON.stringify(job), 'utf8');
    }

    /**
     * Loads the Workflow from the DART Worflow database whose name
     * matches this.workflowName and stores it in this._workflowObj.
     * Returns true if it was able to load the {@link Workflow}.
     * Returns false if there is no such workflow in the database.
     *
     * If this returns false, the caller should check this.errors['workflow']
     * and should assume that no further operations will succeed.
     *
     * @returns {boolean}
     */
    _loadWorkflow() {
        this._workflowObj = Workflow.firstMatching('name', this.workflowName);
        if (!this._workflowObj) {
            this.errors['workflow'] = Context.y18n.__('Cannot find workflow %s', this.workflowName);
            return false;
        }
        return true;
    }

    /**
     * Sets this._bagItProfile to the {@link BagItProfile} object whose
     * id is stored in this._workFlowObj.bagItProfileId, or does nothing if
     * no profile id is specified. Returns false and sets
     * this.errors['bagItProfile'] if a profile id was specified
     * but no matching BagItProfile could be found. Returns true otherwise.
     * If this returns false, the caller should assume that no further
     * operations on this object will succeed.
     *
     * @returns {boolean}
     */
    _loadBagItProfile() {
        if (!this._workflowObj) {
            this._loadWorkflow();
        }
        if (this._workflowObj.bagItProfileId) {
            this._bagItProfile = BagItProfile.find(this._workflowObj.bagItProfileId);
            if (!this._bagItProfile) {
                this.errors['bagItProfile'] = Context.y18n.__("Could not find BagItProfile with id %s", this._workflowObj.bagItProfileId);
                return false;
            }
        }
        return true;
    }

    /**
     * Builds a {@link Job} object based on the workflow and other params
     * specified in this JobParams object. Returns the object, but does
     * not save it to the DART Jobs database. It's up to the caller to do
     * that, if they so choose.
     *
     * @returns {Job}
     */
    _buildJob() {
        // Note: No need to create job.validationOp. The JobRunner will
        // create that if the package format is BagIt and the package was
        // successfully created. See workers/job_runner.js#createPackage().
        let job = new Job();
        job.name = this._workflowObj.packageName || Job.genericName();
        job.bagItProfile = this._bagItProfile;
        job.workflowId = this._workflowObj.id;
        this._makePackageOp(job);
        this._makeUploadOps(job);
        this._mergeTags(job);
        return job;
    }

    /**
     * Creates the {@link PackageOperation} for the {@link Job} returned
     * by {@link JobParams#buildJob}.
     *
     * @param {Job}
     */
    _makePackageOp(job) {
        if (this.packageName) {
            let outputPath = this._getOutputPath();
            job.packageOp = new PackageOperation(this.packageName, outputPath);
            job.packageOp.packageFormat = this._workflowObj.packageFormat;
            job.packageOp.pluginId = this._workflowObj.packagePluginId;
            job.packageOp.sourceFiles = this.files;
            this._setSerialization(job);
        }
    }

    /**
     * This sets the bagItSerialization attribute of the job's
     * PackageOperation, if necessary. Because DART supports only tar
     * serialization (as of July, 2020), this only looks for and sets
     * the values 'application/tar' or 'application/x-tar'.
     *
     * This method will need to be revisited in the future as DART
     * supports more serialization formats.
     *
     */
    _setSerialization(job) {
        if (job.packageOp == null || job.bagItProfile == null) {
            return;
        }
        let profile = job.bagItProfile;
        let formats = profile.acceptSerialization;
        let serializationOK = (profile.serialization == 'required' ||
                               profile.serialization == 'optional');
        let supportsTar = (formats.includes('application/tar') ||
                           formats.includes('application/x-tar'))
        if (serializationOK && supportsTar) {
            job.packageOp.bagItSerialization = '.tar';
            if (!job.packageOp.outputPath.endsWith('.tar')) {
                job.packageOp.outputPath += '.tar';
            }
        }
    }

    /**
     * Creates the {@link UploadOperation}s for the {@link Job} returned
     * by {@link JobParams#buildJob}.
     *
     * @param {Job}
     */
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

    /**
     * Returns the output path of the package that will be built during
     * the Job's packaging stage.
     *
     * @returns {string}
     */
    _getOutputPath() {
        let outputPath = null;
        if (this.packageName) {
            let outputDir = AppSetting.firstMatching('name', 'Bagging Directory').value;
            outputPath = path.join(outputDir, this.packageName);
        }
        return outputPath;
    }

    /**
     * This converts a generic hash/object into an JobParams
     * object. this is useful when loading objects from JSON.
     *
     * @param {object} data - An object you want to convert to an
     * JobParams. The object should include the same properties as
     * a JobParams object.
     *
     * @returns {JobParams}
     */
    static inflateFrom(data) {
        let setting = new JobParams();
        Object.assign(setting, data);
        return setting;
    }

}

module.exports.JobParams = JobParams;
