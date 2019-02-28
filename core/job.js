const { AppSetting } = require('./app_setting');
const { Context } = require('./context');
const dateFormat = require('dateformat');
const path = require('path');
const { PersistentObject } = require('./persistent_object');
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
     * @param {PackagingOperation} opts.packagingOp - An object describing
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
        opts.type = 'Job';
        super(opts);
        this.bagItProfile = opts.bagItProfile || null;
        this.packagingOp = opts.packagingOp || null;
        this.validationOp = opts.validationOp || null;
        this.uploadOps = opts.uploadOps || [];
        this.createdAt = opts.createdAt || new Date();
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
        if (this.packagingOp) {
            name = path.basename(this.packagingOp.outputPath);
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
            name = `Job of ${dateFormat(this.created, 'shortDate')} ${dateFormat(this.created, 'shortTime')}`;
        }
        return name
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
     * validate returns true or false, indicating whether this object
     * contains complete and valid data. If it returns false, check
     * the errors property for specific errors.
     *
     * @returns {boolean}
     */
    validate() {
        super.validate();
        if (this.packagingOp) {
            this.packagingOp.validate();
            for(let [key, value] of Object.entries(this.packagingOp.errors)) {
                this.errors[key] = value;
            }
            // TODO: Require BagItProfile if packaging op is BagIt.
            // TODO: Mechanism for signifying this is a BagIt job (as opposed to just tar or zip)
        }
        if (this.validationOp) {
            this.validationOp.validate();
            for(let [key, value] of Object.entries(this.validationOp.errors)) {
                this.errors[key] = value;
            }
            if (!this.bagItProfile) {
                result.errors['Job.bagItProfile'] = 'Validation requires a BagItProfile.';
            }
        }
        var opNum = 0;
        for (var uploadOp of this.uploadOps) {
            uploadOp.validate();
            for(let [key, value] of Object.entries(this.uploadOp.errors)) {
                this.errors[key] = value;
            }
            opNum++;
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * find finds the object with the specified id in the datastore
     * and returns it. Returns undefined if the object is not in the datastore.
     *
     * @param {string} id - The id (UUID) of the object you want to find.
     *
     * @returns {Job}
     */
    static find(id) {
        return Context.db('Job').get(id);
    }

    /**
     * sort sorts all of the items in the Conf datastore (JSON text file)
     * on the specified property in either 'asc' (ascending) or 'desc' (descending)
     * order. This does not affect the order of the records in the file, but
     * it returns a sorted list of objects.
     *
     * @param {string} property - The property to sort on.
     * @param {string} direction - Sort direction: 'asc' or 'desc'
     *
     * @returns {Array<Job>}
     */
    static sort(property, direction) {
        return PersistentObject.sort(Context.db('Job'), property, direction);
    }

    /**
     * findMatching returns an array of items matching the specified criteria.
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {string} property - The name of the property to match.
     * @param {string} value - The value of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {number} opts.limit - Limit to this many results.
     * @param {number} opts.offset - Start results from this offset.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending)
     * or 'desc'. Default is asc.
     *
     * @returns {Array<Job>}
     */
    static findMatching(property, value, opts) {
        return PersistentObject.findMatching(Context.db('Job'), property, value, opts);
    }

    /**
     * firstMatching returns the first item matching the specified criteria,
     * or null if no item matches.
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {string} property - The name of the property to match.
     * @param {string} value - The value of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending)
     * or 'desc'. Default is asc.
     *
     * @returns {Job}
     */
    static firstMatching(property, value, opts) {
        return PersistentObject.firstMatching(Context.db('Job'), property, value, opts);
    }

    /**
     * list returns an array of items matched by the filter function.
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {filterFunction} filterFunction - A function to filter out
     * items that should not go into the results.
     * @param {Object} opts - Optional additional params.
     * @param {number} opts.limit - Limit to this many results.
     * @param {number} opts.offset - Start results from this offset.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending)
     * or 'desc'. Default is asc.
     *
     * @returns {Array<Job>}
     */
    static list(filterFunction, opts) {
        return PersistentObject.list(Context.db('Job'), filterFunction, opts);
    }

    /**
     * first returns the first item matching that passes the filterFunction.
     * You can combine orderBy, sortDirection, and offset to get the second,
     * third, etc. match for the given criteria, but note that this function
     * only returns a single item at most (or null if there are no matches).
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {filterFunction} filterFunction - A function to filter out items
     * that should not go into the results.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     * @param {number} opts.offset - Skip this many items before choosing a result.
     *
     * @returns {Job}
     */
    static first(filterFunction, opts) {
        return PersistentObject.first(Context.db('Job'), filterFunction, opts);
    }
}

module.exports.Job = Job;
