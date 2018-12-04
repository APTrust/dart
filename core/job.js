const { AppSetting } = require('./app_setting');
const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');
const { ValidationResult } = require('./validation_result');

/**
 * Job describes a series of related actions for DART to perform.
 * This typically includes packaging a number of files and sending
 * them across a network to one or more remote repositories, though
 * it does not have to include those actions. A job may consist of
 * a single action, such as validating a bag or uploading a file
 * to an S3 bucket.
 */
class Job extends PersistentObject {
    constructor() {
        super('Job');
        this.bagItProfile = null;
        this.packagingOperation = null;
        this.validationOperation = null;
        this.uploadOperations = [];
    }

    /**
     * validate returns a ValidationResult that describes what if anything
     * is not valid about this job. Classes that derive from PersistentObject
     * must have their own custom implementation of this method.
     *
     * @returns {ValidationResult} - The result of the validation check.
     */
    validate() {
        // TODO: Validate
        return new ValidationResult();
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
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
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
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
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
     * @param {filterFunction} filterFunction - The name of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {number} opts.limit - Limit to this many results.
     * @param {number} opts.offset - Start results from this offset.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Array<Job>}
     */
    static list(filterFunction, opts) {
        return PersistentObject.list(Context.db('Job'), filterFunction, opts);
    }

    /**
     * first returns the first item matching that passes the filterFunction.
     * You can combine orderBy, sortDirection, and offset to get the second, third, etc.
     * match for the given criteria, but note that this function only returns a
     * single item at most (or null if there are no matches).
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {filterFunction} filterFunction - The name of the property to match.
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
