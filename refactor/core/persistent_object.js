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
 * set by derived classes in the constructor.
 */
class PersistentObject {
    constructor(type) {
        this.id = Util.uuid4();
        this.type = type;
        this.db = Context.db(type);
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
        this.db.set(this.id, this);
    }


    /**
     * Delete this object from persistent storage. Returns a copy of the
     * deleted object.
     *
     * @returns {Object}
     */
    delete() {
        this.db.delete(this.id);
        return this;
    }

    /**
     * find finds the object with the specified id in the datastore
     * and returns it. Returns null if the object is not in the datastore.
     *
     * @returns {Object}
     */
    find(id) {
        return this.db.get(id);
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
    findMatching(property, value, opts = null) {

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
     * @param {string} property - The name of the property to match.
     * @param {string} value - The value of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object}
     */
    firstMatching(property, value) {

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
     * @param {filterFunction} filterFunction - The name of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {number} opts.limit - Limit to this many results.
     * @param {number} opts.offset - Start results from this offset.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object[]}
     */
    list(filterFunction = null, opts = null) {

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
     * @param {filterFunction} filterFunction - The name of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object}
     */
    first(filterFunction = null, opts = null) {

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
