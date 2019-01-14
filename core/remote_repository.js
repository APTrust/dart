const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');

/**
 * RemoteRepository contains settings required to access the REST
 * services of a remote repository, such as the URL and connection
 * credentials. To access the remote repository, you'll also need
 * a repository plugin that can send requests and parse responses
 * from the remote repo.
 */
class RemoteRepository extends PersistentObject {
    /**
     * Creates a new RemoteRepository
     *
     * @param {string} name - The name of the setting. This should be
     * unique, to prevent conflicts.
     *
     * @param {string} value - The value of the setting.
     */
    constructor(name) {
        super('RemoteRepository');
        /**
          * Name is the name of the setting.
          * Setting names should be unique, to prevent confusion.
          *
          * @type {string}
          */
        this.name = name;
        /**
          * The URL that runs the remote repository's REST service.
          *
          * @type {string}
          */
        this.url = "";
        /**
          * The User ID used to connect to the repository's REST services.
          * This is optional, and will often be blank, as most REST
          * services require only an API token to connect.
          *
          * @type {string}
          */
        this.userId = "";
        /**
          * The API token required to connect to the remote repository's
          * REST service.
          *
          * @type {string}
          */
        this.apiToken = "";
        /**
          * Optional additional information required to connect to the
          * remote REST service. Most services won't use this.
          *
          * @type {string}
          */
        this.loginExtra = "";
        /**
          * The UUID of the DART plugin that provides access to the REST
          * service. You cannot connect to any remote REST service without
          * a plugin.
          *
          * @type {string}
          */
        this.pluginId = "";
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
        if (Util.isEmpty(this.name)) {
            this.errors["name"] = "Name cannot be empty.";
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * find finds the object with the specified id in the datastore
     * and returns it. Returns undefined if the object is not in the
     * datastore.
     *
     * @param {string} id - The id (UUID) of the object you want to find.
     *
     * @returns {Object}
     */
    static find(id) {
        let data = Context.db('RemoteRepository').get(id);
        if (data) {
            return Object.assign(new RemoteRepository(), data);
        }
        return undefined;
    }

    /**
     * sort sorts all of the items in the Conf datastore (JSON text file)
     * on the specified property in either 'asc' (ascending) or 'desc'
     * (descending)  order. This does not affect the order of the records
     * in the file, but it returns a sorted list of objects.
     *
     * @param {string} property - The property to sort on.
     * @param {string} direction - Sort direction: 'asc' or 'desc'
     *
     * @returns {Object[]}
     */
    static sort(property, direction) {
        return PersistentObject.sort(Context.db('RemoteRepository'), property, direction);
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
     * @returns {Object[]}
     */
    static findMatching(property, value, opts) {
        return PersistentObject.findMatching(Context.db('RemoteRepository'), property, value, opts);
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
     * @returns {Object}
     */
    static firstMatching(property, value, opts) {
        return PersistentObject.firstMatching(Context.db('RemoteRepository'), property, value, opts);
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
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object[]}
     */
    static list(filterFunction, opts) {
        return PersistentObject.list(Context.db('RemoteRepository'), filterFunction, opts);
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
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending)
     * or 'desc'. Default is asc.
     * @param {number} opts.offset - Skip this many items before choosing a result.
     *
     * @returns {Object}
     */
    static first(filterFunction, opts) {
        return PersistentObject.first(Context.db('RemoteRepository'), filterFunction, opts);
    }
}

module.exports.RemoteRepository = RemoteRepository;
