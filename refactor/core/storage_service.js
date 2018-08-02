const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');
const { ValidationResult } = require('./validation_result');

/**
 * StorageService describes any remote service (s3, ftp, etc.) to which
 * we can upload data. This object contains the information required to
 * connect to the remote service (hostname, login name, password, etc.).
 */
class StorageService extends PersistentObject {
    /**
     * Creates a new StorageService.
     *
     * @param {string} name - The name of the remote storage service. This
     * can be anything that's meaningful to the user (e.g. 'My S3 Bucket',
     * 'Library SFTP Server', etc.). Names should be unique to prevent confusion.
     *
     */
    constructor(name) {
        super('StorageService');
        this.id = Util.uuid4();
        this.name = name;
        this.description = "";
        this.protocol = "";
        this.host = "";
        this.port = "";
        this.bucket = "";
        this.loginName = "";
        this.loginPassword = "";
        this.loginExtra = "";
    }

    /**
     * validate returns a ValidationResult that describes what if anything
     * is not valid about this object. Classes that derive from PersistentObject
     * must have their own custom implementation of this method.
     *
     * @returns {ValidationResult} - The result of the validation check.
     */
    validate() {
        var result = new ValidationResult();
        if (Util.isEmpty(this.id)) {
            result.errors["id"] = "Id cannot be empty";
        }
        if (Util.isEmpty(this.name)) {
            result.errors["name"] = "Name cannot be empty";
        }
        if (Util.isEmpty(this.protocol)) {
            result.errors["protocol"] = "Protocol cannot be empty";
        }
        if (Util.isEmpty(this.host)) {
            result.errors["host"] = "Host cannot be empty";
        }
        if (!Util.isEmpty(this.port) && parseInt(this.port, 10) != this.port) {
            result.errors["port"] = "Port must be a whole number, or leave blank to use the default port.";
        }
        return result
    }

    /**
     * find finds the object with the specified id in the datastore
     * and returns it. Returns undefined if the object is not in the datastore.
     *
     * @param {string} id - The id (UUID) of the object you want to find.
     *
     * @returns {Object}
     */
    static find(id) {
        return Context.db('StorageService').get(id);
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
     * @returns {Object[]}
     */
    static sort(property, direction) {
        return PersistentObject.sort(Context.db('StorageService'), property, direction);
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
     * @returns {Object[]}
     */
    static findMatching(property, value, opts) {
        return PersistentObject.findMatching(Context.db('StorageService'), property, value, opts);
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
     * @returns {Object}
     */
    static firstMatching(property, value, opts) {
        return PersistentObject.firstMatching(Context.db('StorageService'), property, value, opts);
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
     * @returns {Object[]}
     */
    static list(filterFunction, opts) {
        return PersistentObject.list(Context.db('StorageService'), filterFunction, opts);
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
     * @returns {Object}
     */
    static first(filterFunction, opts) {
        return PersistentObject.first(Context.db('StorageService'), filterFunction, opts);
    }

}

module.exports.StorageService = StorageService;
