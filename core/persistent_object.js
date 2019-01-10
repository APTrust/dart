const { Context } = require('./context');
const { JsonStore } = require('./json_store');
const { Util } = require('./util');

/**
 * PersistentObject is the base class for all objects that we want
 * to be able to persist to a JsonStore (a plain-text JSON file in
 * which we can save, retrieve, update, and delete individual objects.)
 *
 * For example, if you pass 'AppSetting' as the type param, the object
 * you create will be stored in the AppSetting.json file in the application's
 * data directory. (See the link to JsonStore below.)
 *
 * If the underlying data store for your class does not yet exist, it will
 * be created the first time you call save(), find(), or any other
 * function that accesses the underlying datastore.
 *
 * @see {@link JsonStore} for more about the JsonStore object.
 * @see {@link Context#dataStores} for info about how DART keeps track of
 * different datastores.
 *
 */
class PersistentObject {
    /**
     * Creates a new PersistentObject.
     *
     * @param {string} type - The class name of the object you are creating.
     * The underlying JsonStore will save this object (and all others of its
     * class) in a file whose name matches the type paramater you pass in here.
     *
     * This constructor is meant to be called by the constructors in subclasses,
     * which pass their class name as the type param.
     *
     */
    constructor(type) {
        if (Util.isEmpty(type)) {
            throw new Error("Param 'type' is required.");
        }
        /**
          * id is this object's unique identifier, and the best handle
          * to use when retrieving it from storage. This is a version 4
          * UUID in hex string format. It is set by the constructor when
          * you create a new PersistentObject. You should not change it.
          *
          * @type {string}
          */
        this.id = Util.uuid4();
        /**
          * type is the object's classname. This should be set by the
          * constructor in all derived classes.
          *
          * @type {string}
          */
        this.type = type;
        /**
          * userCanDelete indicates whether or not the user can delete
          * this object from storage. The defaults to false, but you may
          * want to set it to true for select items that are required for
          * your plugin to work. For example, your plugin depends on the
          * presence of a pre-installed BagIt profile or an AppSetting
          * called 'Account Number' (or whatever), you can set this property
          * to false and the user will not be able to delete the property.
          *
          * @type {string}
          * @default true
          */
        this.userCanDelete = true;
        /**
          * The errors property contains information about why this object
          * is not valid. This property will be empty when an object is
          * created, and is populated by the validate() method. If there
          * are validation errors, the keys in the error object will be
          * the names of invalid properties. The values will be error messages
          * describing why the property is invalid. If validate() determines
          * that the object is valid, errors will be empty.
          *
          * @type {Object<string, string>}
          */
        this.errors = {};
    }

    /**
     * validate returns true if this object is valid, false if not. If the
     * object is not valid, this populates the errors property with info
     * describing what is not valid. Classes that derive from PersistentObject
     * should have their own custom implementation of this method.
     *
     * @returns {boolean}
     */
    validate() {
        this.errors = {};
        if (Util.isEmpty(this.id)) {
            this.errors["id"] = "Id cannot be empty.";
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * Save this object to persistent storage. Returns the object after saving.
     *
     * @returns {PersistentObject}
     */
    save() {
        Context.db(this.type).set(this.id, this);
        return this;
    }


    /**
     * Delete this object from persistent storage. Returns a copy of the
     * deleted object.
     *
     * @returns {Object}
     */
    delete() {
        if (!this.userCanDelete) {
            throw new Error("User cannot delete this object.");
        }
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
        // Don't overwrite opts. Caller may want to reuse it.
        var mergedOpts = Object.assign({}, opts);
        mergedOpts.limit = mergedOpts.limit || 0;
        mergedOpts.offset = mergedOpts.offset || 0;
        mergedOpts.orderBy = mergedOpts.orderBy || null;
        mergedOpts.sortDirection = mergedOpts.sortDirection || 'asc';
        return mergedOpts;
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
        let list = [];
        for (var key in db.store) {
            list.push(db.store[key]);
        }
        if (property) {
            let sortFunction = Util.getSortFunction(property, direction);
            list.sort(sortFunction);
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
        let filterFunction = (obj) => { return obj[property] == value };
        return PersistentObject.list(db, filterFunction, opts);
    }

    /**
     * firstMatching returns the first item matching the specified criteria,
     * or null if no item matches.
     *
     * @example
     * // Get the first object where obj.name == 'Homer'
     * let obj = persistentObject.findMatching('name', 'Homer');
     *
     * @example
     * // Get the newest object where obj.name == 'Homer'
     * let obj = persistentObject.findMatching('name', 'Homer', {orderBy: 'createdAt', sortDirection: 'desc'});
     *
     * @example
     * // Get the second newest object where obj.name == 'Homer'
     * let obj = persistentObject.first('name', 'Homer', {orderBy: 'createdAt', sortDirection: 'desc', offset: 1});
     *
     * @example
     * // Get the oldest object where obj.name == 'Homer'
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
        let filterFunction = (obj) => { return obj[property] == value };
        let mergedOpts = PersistentObject.mergeDefaultOpts(opts);
        mergedOpts.limit = 1;
        let matches = PersistentObject.list(db, filterFunction, mergedOpts);
        return matches[0] || null;
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
        opts = PersistentObject.mergeDefaultOpts(opts);
        let sortedList = PersistentObject.sort(db, opts.orderBy, opts.sortDirection);
        if (filterFunction == null) {
            return sortedList;
        }
        let matches = [];  // List of matched objects to return
        let matched = 0;   // Count of objects matched so far. We may skip some, due to opts.offset.
        for (let obj of sortedList) {
            if (filterFunction(obj)) {
                matched++;
                if (matched > opts.offset && (opts.limit < 1 || matches.length < opts.limit)) {
                    matches.push(obj);
                }
                if (opts.limit > 0 && matches.length == opts.limit) {
                    break;
                }
            }
        }
        return matches;
    }

    /**
     * first returns the first item matching that passes the filterFunction.
     * You can combine orderBy, sortDirection, and offset to get the second, third, etc.
     * match for the given criteria, but note that this function only returns a
     * single item at most (or null if there are no matches).
     *
     * @example
     * // Define a filter function
     * function nameAndAge(obj) {
     *    return obj.name === 'Homer' && obj.age > 30;
     * }
     *
     * // Get the first matching object
     * let obj = persistentObject.first(nameAndAge);
     *
     * // Get the newest matching object
     * let obj = persistentObject.first(nameAndAge,  {orderBy: 'createdAt', sortDirection: 'desc'});
     *
     * // Get the second newest matching object
     * let obj = persistentObject.first(nameAndAge,  {orderBy: 'createdAt', sortDirection: 'desc', offset: 1});
     *
     * // Get the oldest matching object
     * let obj = persistentObject.first(nameAndAge,  {orderBy: 'createdAt', sortDirection: 'asc'});
     *
     * @param {Conf} db - The conf datastore in which to search.
     * @param {filterFunction} filterFunction - The name of the property to match.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     * @param {number} opts.offset - Skip this many items before choosing a result.
     *
     * @returns {Object}
     */
    static first(db, filterFunction, opts) {
        let matches = PersistentObject.list(db, filterFunction, opts);
        return matches[0] || null;
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
