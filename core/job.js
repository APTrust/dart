const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const dateFormat = require('dateformat');
const fs = require('fs');
const { PackageOperation } = require('./package_operation');
const path = require('path');
const { PersistentObject } = require('./persistent_object');
const { ValidationOperation } = require('./validation_operation');
const { UploadOperation } = require('./upload_operation');
const { Util } = require('./util');

/**
 * This is a list of BagItProfile tags to check to try to find a
 * meaningful title for this job. DART checks them in order and
 * returns the first one that has a non-empty user-defined value.
 */
const titleTags = [
    "Title",
    "Internal-Sender-Identifier",
    "External-Identifier",
    "Internal-Sender-Description",
    "External-Description",
    "Description"
];

/**
 * Job describes a series of related actions for DART to perform.
 * This typically includes packaging a number of files and sending
 * them across a network to one or more remote repositories, though
 * it does not have to include those actions. A job may consist of
 * a single action, such as validating a bag or uploading a file
 * to an S3 bucket.
 */
class Job extends PersistentObject {
    /**
     * @param {string} opts.id - A UUID in hex-string format. This is
     * the object's unique identifier.
     *
     * @param {boolean} opts.userCanDelete - Indicates whether user is
     * allowed to delete this record.
     *
     * @param {BagItProfile} opts.bagItProfile - A BagItProfile object.
     * This is required only for bagging and validation jobs.
     *
     * @param {PackageOperation} opts.packageOp - An object describing
     * what this job is supposed to package. The is relevant only to
     * jobs that involving bagging or other forms of packaging.
     *
     * @param {ValidationOperation} opts.validationOp - An object
     * describing what is to be validated. This is relevant only if the
     * job includes a validation step.
     *
     * @param {Array<UploadOperation>} opts.uploadOps - A list of objects
     * describing what should be uploaded, and to where. This is relevant
     * only for jobs that will be uploading materials.
     */
    constructor(opts = {}) {
        super(opts);
        this.bagItProfile = opts.bagItProfile || null;
        this.packageOp = opts.packageOp || new PackageOperation();
        this.validationOp = opts.validationOp || null;
        this.uploadOps = opts.uploadOps || [];
        this.createdAt = opts.createdAt || new Date();

        /**
         * This hash will contain descriptions of job validation errors
         * after you call job.validate(). This does NOT contain information
         * about errors that occurred while running the job. For those, see
         * the result propertype (type {@link OperationResult}) of the
         * job's {@link PackageOperation}, {@link ValidationOperation},
         * or {@link UploadOperation}.
         */
        this.errors = {};

        /**
         * The total number of files to be packaged and/or uploaded
         * by this job. This value is set when building a Job through
         * the DART UI, but it may not be set by the command-line tools.
         * If DART does not set this value, it remains at the default
         * of -1.
         *
         * @type {number}
         * @default -1
         */
        this.fileCount = -1;

        /**
         * The total number of directories to be packaged and/or uploaded
         * by this job. This value is set when building a Job through
         * the DART UI, but it may not be set by the command-line tools.
         * If DART does not set this value, it remains at the default
         * of -1.
         *
         * @type {number}
         * @default -1
         */
        this.dirCount = -1;

        /**
         * The total number of bytes in the payload to be packaged
         * and/or uploaded by this job. This number may not match
         * to total size of the bag the job produces because the bag
         * may include additiaonal manifests and tag files, and it may
         * be serialized to a format like tar that makes it slightly
         * larger, or to a format like zip or gzip that makes it
         * smaller.
         *
         * This value is set when building a Job through the DART UI,
         * but it may not be set by the command-line tools.
         * If DART does not set this value, it remains at the default
         * of -1.
         *
         * @type {number}
         * @default -1
         */
        this.byteCount = -1;
    }

    /**
     * This returns a title for display purposes. It will use the first
     * available non-empty value of: 1) the name of the file that the job
     * packaged, 2) the name of the file that the job uploaded, or 3) a
     * title or description of the bag from within the bag's tag files.
     * If none of those is available, this will return "Job of <timestamp>",
     * where timestamp is date and time the job was created.
     *
     * @returns {string}
     */
    title() {
        // Try to get the name of the file that was created or uploaded.
        var name = null;
        if (!name && this.packageOp && this.packageOp.packageName) {
            name = path.basename(this.packageOp.packageName);
        }
        if (!name && this.uploadOps.length > 0 && this.uploadOps[0].sourceFiles.length > 0) {
            name = path.basename(this.uploadOps[0].sourceFiles[0]);
        }
        // Try to get a title from the bag.
        if (!name && this.bagItProfile) {
            for (let tagName of titleTags) {
                let tag = this.bagItProfile.firstMatchingTag('tagName', tagName);
                if (tag && tag.userValue) {
                    name = tag.userValue;
                    break;
                }
            }
        }
        // If no title or filename, create a generic name.
        if (!name) {
            name = `Job of ${dateFormat(this.createdAt, 'shortDate')} ${dateFormat(this.createdAt, 'shortTime')}`;
        }
        return Util.truncateString(name, 40);
    }

    /**
     * Returns the datetime on which this job's package operation completed.
     *
     * @returns {Date}
     */
    packagedAt() {
        var packagedAt = null;
        if (this.packageOp && this.packageOp.result && this.packageOp.result.completed) {
            packagedAt = this.packageOp.result.completed;
        }
        return packagedAt;
    }

    /**
     * Returns true if DART attempted to execute this job's package
     * operation.
     *
     * @returns {boolean}
     */
    packageAttempted() {
        if (this.packageOp && this.packageOp.result) {
            return this.packageOp.result.attempt > 0;
        }
        return false;
    }

    /**
     * Returns true if DART successfully completed this job's package
     * operation. Note that this will return false if packaging failed
     * and if packaging was never attempted, so check
     * {@link packageAttempted} as well.
     *
     * @returns {boolean}
     */
    packageSucceeded() {
        if (this.packageOp && this.packageOp.result) {
            return this.packageOp.result.succeeded();
        }
        return false;
    }

    /**
     * Returns the datetime on which this job's validation operation completed.
     *
     * @returns {Date}
     */
    validatedAt() {
        var validatedAt = null;
        if (this.validationOp && this.validationOp.result && this.validationOp.result.completed) {
            validatedAt = this.validationOp.result.completed;
        }
        return validatedAt;
    }

    /**
     * Returns true if DART attempted to execute this job's validation
     * operation.
     *
     * @returns {boolean}
     */
    validationAttempted() {
        if (this.validationOp && this.validationOp.result) {
            return this.validationOp.result.attempt > 0;
        }
        return false;
    }

    /**
     * Returns true if DART successfully completed this job's validation
     * operation. See {@link validationAttempted} as well.
     *
     * @returns {boolean}
     */
    validationSucceeded() {
        if (this.validationOp && this.validationOp.result) {
            return this.validationOp.result.succeeded();
        }
        return false;
    }

    /**
     * Returns the datetime on which this job's last upload operation completed.
     *
     * @returns {Date}
     */
    uploadedAt() {
        var uploadedAt = null;
        if (this.uploadOps.length > 0) {
            for (let uploadOp of this.uploadOps) {
                if (uploadOp.result && uploadOp.result.completed) {
                    uploadedAt = uploadOp.result.completed;
                }
            }
        }
        return uploadedAt;
    }

    /**
     * Returns true if DART attempted to execute any of this job's upload
     * operations.
     *
     * @returns {boolean}
     */
    uploadAttempted() {
        if (this.uploadOps) {
            for (let op of this.uploadOps) {
                if (op.result) {
                    if (op.result.attempt > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Returns true if DART successfully completed all of this job's upload
     * operations. See {@link uploadAttempted} as well.
     *
     * @returns {boolean}
     */
    uploadSucceeded() {
        let anyAttempted = false;
        let allSucceeded = true;
        if (this.uploadOps) {
            for (let op of this.uploadOps) {
                if (op.result) {
                    if (op.result.attempt > 0) {
                        anyAttempted = true;
                    }
                    if (!op.result.succeeded()) {
                        allSucceeded = false;
                    }
                }
            }
        }
        return (anyAttempted && allSucceeded);
    }

    /**
     * validate returns true or false, indicating whether this object
     * contains complete and valid data. If it returns false, check
     * the errors property for specific errors.
     *
     * @returns {boolean}
     */
    validate() {
        super.validate();
        if (this.packageOp) {
            this.packageOp.validate();
            Object.assign(this.errors, this.packageOp.errors);
            // TODO: Require BagItProfile if packaging op is BagIt.
            // TODO: Mechanism for signifying this is a BagIt job (as opposed to just tar or zip)
        }
        if (this.validationOp) {
            this.validationOp.validate();
            Object.assign(this.errors, this.validationOp.errors);
            if (!this.bagItProfile) {
                result.errors['Job.bagItProfile'] = 'Validation requires a BagItProfile.';
            }
        }
        var opNum = 0;
        for (var uploadOp of this.uploadOps) {
            uploadOp.validate();
            Object.assign(this.errors, uploadOp.errors);
            opNum++;
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * This converts the JSON representation of a job as stored in the DB
     * to a full-fledged Job object with all of the expected methods.
     *
     * @param {Object} data - A JavaScript hash.
     *
     * @returns {Job}
     */
    static inflateFrom(data) {
        let job = new Job();
        Object.assign(job, data);
        if (data.bagItProfile) {
            job.bagItProfile = BagItProfile.inflateFrom(data.bagItProfile);
        }
        if (data.packageOp) {
            job.packageOp = PackageOperation.inflateFrom(data.packageOp);
        }
        if (data.validationOp) {
            job.validationOp = ValidationOperation.inflateFrom(data.validationOp);
        }
        if (data.uploadOps) {
            job.uploadOps = [];
            for (let op of data.uploadOps) {
                job.uploadOps.push(UploadOperation.inflateFrom(op));
            }
        }
        return job;
    }

    /**
     * This converts the JSON data in the file at pathToFile into a
     * Job object.
     *
     * @param {string} pathToFile - The path to the JSON file.
     *
     * @returns {Job}
     */
    static inflateFromFile(pathToFile) {
        let data = JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
        return Job.inflateFrom(data);
    }

    /**
     * find finds the Job with the specified id in the datastore
     * and returns it. Returns undefined if the object is not in the datastore.
     *
     * This overrides the find() method of the PersistentObject to return
     * a correctly constructed Job object.
     *
     * @param {string} id - The id (UUID) of the job you want to find.
     *
     * @returns {Job}
     */
    static find(id) {
        let data = Context.db('Job').get(id);
        if (data) {
            return Job.inflateFrom(data);
        }
        return undefined;
    }
}

// Get static methods from base.
Object.assign(Job, PersistentObject);

module.exports.Job = Job;
