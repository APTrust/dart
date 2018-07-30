const { Context } = require('./context');
const { JsonStore } = require('./json_store');
const { Util } = require('./util');
const { ValidationResult } = require('./validation_result');

/**
 * PersistentObject is the base class for all objects that we want
 * to be able to persist to a JsonStore (a plain-text JSON file in
 * which we can save, retrieve, update, and delete individual objects.)
 *
 * @param {string} type - The class name of the object. This should be
 * set by derived classes in the constructor. It cannot be null or empty.
 */
class PersistentObject {
    constructor(type) {
        if (Util.isEmpty(type)) {
            throw new Error("Param 'type' is required.");
        }
        this.id = Util.uuid4();
        this.type = type;
    }

    /**
     * validate returns a ValidationResult that describes what if anything
     * is not valid about this object. Classes that derive from PersistentObject
     * must have their own custom implementation of this method.
     *
     * @returns {ValidationResult} - The result of the validation check.
     */
    validate() {
        throw new Error("Method validate() is implemented in base class.");
    }

    /**
     * Save this object to persistent storage.
     *
     */
    save() {
        Context.db(this.type).set(this.id, this);
    }


    /**
     * Delete this object from persistent storage. Returns a copy of the
     * deleted object.
     *
     * @returns {Object}
     */
    delete() {
        Context.db(this.type).delete(this.id);
        return this;
    }

    /**
     * find finds the object with the specified id in the datastore
     * and returns it. Returns undefined if the object is not in the datastore.
     *
     * @param {Conf} db - The datastore containing the objects to search.
     * @param {string} id - The id (UUID) of the object you want to find.
     *
     * @returns {Object}
     */
    static find(db, id) {
        return db.get(id);
    }

    /**
     * mergeDefaultOpts sets missing option values to their default values.
     * This function is meant for internal use.
     *
     * @param {Object} opts - A potentially null hash of options.
     *
     * @returns {Object}
     */
    static mergeDefaultOpts(opts) {
        opts = opts || {};
        opts.limit = opts.limit || 0;
        opts.offset = opts.offset || 0;
        opts.sortDirection = opts.direction || 'asc';
        return opts;
    }

    /**
     * sort sorts all of the items in the Conf datastore (JSON text file)
     * on the specified property in either 'asc' (ascending) or 'desc' (descending)
     * order. This does not affect the order of the records in the file, but
     * it returns a sorted list of objects.
     *
     * @param {Conf} db - The datastore containing the objects to sort.
     * @param {string} property - The property to sort on.
     * @param {string} direction - Sort direction: 'asc' or 'desc'
     *
     * @returns {Object[]}
     */
    static sort(db, property, direction) {
        var list = [];
        for (var key in db) {
            list.push(db[key]);
        }
        // Sort descending, ascending, or not at all if no sort property.
        if (property && direction == 'desc') {
            list.sort(function(a, b) {
                if (a[property] < b[property]) { return 1; }
                if (a[property] > b[property]) { return -1; }
                return 0;
            });
        } else if (property) {
            list.sort(function(a, b) {
                if (a[property] < b[property]) { return -1; }
                if (a[property] > b[property]) { return 1; }
                return 0;
            });
        }
        return list;
    }

    /**
     * findMatching returns an array of items matching the specified criteria.
     *
     * @example
     * // Get all objects where obj.name === 'Homer'
     * let results = persistentObject.findMatching('name', 'Homer');
     *
     * @example
     * // Get the first ten objects where obj.name === 'Homer', sorted
     * // by createdAt, with newest first
     * let opts = {limit: 10, offset: 0, orderBy: 'createdAt', sortDir: 'desc'};
     * let results = persistentObject.findMatching('name', 'Homer', opts);
     *
     * @param {Conf} db - The conf datastore in which to search.
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
    static findMatching(db, property, value, opts) {
        // if (!this.hasOwnProperty(property)) {
        //     throw new Error(`Object ${this.type} has no property ${property}`);
        // }
        let filterFunction = (obj) => { return obj[property] == value; };
        return PersistentObject.list(db, filterFunction, opts);
    }

    /**
     * firstMatching returns the first item matching the specified criteria,
     * or null if no item matches.
     *
     * @example
     * // Get the first object where obj.name === 'Homer'
     * let obj = persistentObject.findMatching('name', 'Homer');
     *
     * @example
     * // Get the newest object where obj.name === 'Homer'
     * let obj = persistentObject.findMatching('name', 'Homer', {orderBy: 'createdAt', sortDirection: 'desc'});
     *
     * @example
     * // Get the oldest object where obj.name === 'Homer'
     * let obj = persistentObject.findMatching('name', 'Homer', {orderBy: 'createdAt', sortDirection: 'asc'});
     *
     * @param {Conf} db - The conf datastore in which to search.
     * @param {string} property - The name of the property to match.
     * @param {string} value - The value of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object}
     */
    static firstMatching(db, property, value, opts) {
        let filterFunction = (obj) => { return obj[property] == value; };
        opts.offset = 0;
        opts.limit = 1;
        return PersistentObject.list(db, filterFunction, opts);
    }

    /**
     * list returns an array of items matched by the filter function.
     *
     * @example
     * function nameAndAge(obj) {
     *    return obj.name === 'Homer' && obj.age > 30;
     * }
     * let results = persistentObject.list(nameAndAge);
     *
     * @example
     * // Get the first ten objects that match the filter, sorted
     * // by createdAt, with newest first
     * let opts = {limit: 10, offset: 0, orderBy: 'createdAt', sortDir: 'desc'};
     * let results = persistentObject.findMatching(nameAndAge, opts);
     *
     * @param {Conf} db - The conf datastore in which to search.
     * @param {filterFunction} filterFunction - The name of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {number} opts.limit - Limit to this many results.
     * @param {number} opts.offset - Start results from this offset.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object[]}
     */
    static list(db, filterFunction, opts) {
        opts = PersistentObject.mergeDefaultOpts;
        let sortedList = PersisntentObject.sort(db, opts.orderBy, opts.sortDirection);
        if (filterFunction == null) {
            return sortedList;
        }
        let matches = [];  // List of matched objects to return
        let matched = 0;   // Count of objects matched so far. We may skip some, due to opts.offset.
        for (let obj of sortedList) {
            if (filterFunction(obj)) {
                matched++;
                if (matched > opts.offset && (opts.limit < 1 || matches.length < limit)) {
                    matches.push(obj);
                }
                if (limit > 0 && matches.length == limit) {
                    break;
                }
            }
        }
        return matches;
    }

    /**
     * first returns the first item matching that passes the filterFunction.
     *
     * @example
     * // Define a filter function
     * function nameAndAge(obj) {
     *    return obj.name === 'Homer' && obj.age > 30;
     * }
     * // Get the first matching object
     * let obj = persistentObject.first(nameAndAge);
     *
     * // Get the newest matching object
     * let obj = persistentObject.first(nameAndAge,  {orderBy: 'createdAt', sortDirection: 'desc'});
     *
     * // Get the oldest matching object
     * let obj = persistentObject.first(nameAndAge,  {orderBy: 'createdAt', sortDirection: 'asc'});
     *
     * @param {Conf} db - The conf datastore in which to search.
     * @param {filterFunction} filterFunction - The name of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object}
     */
    static first(db, filterFunction, opts) {
        opts.offset = 0;
        opts.limit = 1;
        return PersistentObject.list(db, filterFunction, opts);
    }
}

/**
 * PersistentObjectFilter is a simple function for filtering object
 * lists. It should take a single object as a parameter and return
 * either true or false to indicate whether the object passes the filter.
 *
 * @example
 * function nameAndTitleFilter(obj) {
 *    return obj.name.startsWith('A') && (obj.title === 'developer' || obj.title === 'manager');
 * }
 *
 * @callback filterFunction
 * @param {Object}
 * @returns {boolean}
 */

module.exports.PersistentObject = PersistentObject;
