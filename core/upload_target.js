const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');

/**
 * UploadTarget describes any remote service (s3, ftp, etc.) to which
 * we can upload data. This object contains the information required to
 * connect to the remote service (hostname, login name, password, etc.).
 */
class UploadTarget extends PersistentObject {
    /**
     * Creates a new UploadTarget.
     *
     * @param {object} opts - Object containing properties to set.
     *
     * @param {string} opts.id - A UUID in hex-string format. This is
     * the object's unique identifier.
     *
     * @param {boolean} opts.userCanDelete - Indicates whether user is
     * allowed to delete this record.
     *
     * @param {string} opts.name - The name of the remote upload target. This
     * can be anything that's meaningful to the user (e.g. 'My S3 Bucket',
     * 'Library SFTP Server', etc.). Names should be unique to prevent confusion.
     *
     * @param {string} opts.description - A user-friendly description of
     * the upload target.
     *
     * @param {string} opts.protocol - The protocol to use when connecting
     * to the remote repo.
     *
     * @param {string} opts.host - The name or IP address of the remote host.
     *
     * @param {string} opts.port - The port to connect to on the remote host.
     * A value of zero means use the default port.
     *
     * @param {string} opts.bucket - The bucket or root folder into which
     * to upload material.
     *
     * @param {string} opts.login - The user name or AWS Access Key ID to use
     * when authenticating with the remote service.
     *
     * @param {string} opts.password - The password or AWS Secret Access Key
     * to use when authenticating with the remote service.
     *
     * @param {string} opts.loginExtra - Optional additional information to
     * pass to the remote service during the authentication process.
     *
     */
    constructor(opts = {}) {
        opts.type = 'UploadTarget';
        super(opts);
        /**
          * name is the name of this upload target. It should be meaningful
          * to the user.
          *
          * @type {string}
          */
        this.name = opts.name || "";
        /**
          * A description of this upload target. It should be meaningful
          * to the user.
          *
          * @type {string}
          */
        this.description = opts.description || "";
        /**
          * The protocol to use when connecting to the remote service.
          * For example, 's3', 'sftp', etc. There should be a valid plugin
          * capable of communicating via that protocol.
          *
          * @type {string}
          */
        this.protocol = opts.protocol || "";
        /**
          * The hostname or IP address of the remote server.
          *
          * @type {string}
          */
        this.host = opts.host || "";
        /**
          * The port number to connect to on the remote server. This should
          * be a whole number. You can leave this blank if you're connecting
          * to the service's default port.
          *
          * @type {number}
          */
        this.port = opts.port || 0;
        /**
          * Bucket is the name of the s3 bucket to connect to, or the directory
          * to cd into on the remote server.
          *
          * @type {string}
          */
        this.bucket = opts.bucket || "";
        /**
          * login is the name to use when logging in to the remote server.
          * For s3 connections, it's the Access Key Id.
          *
          * @type {string}
          */
        this.login = opts.login || "";
        /**
          * password is the password required to connect to the remote server.
          * For S3, it's the secret key (aka AWS Secret Access Key).
          *
          * @type {string}
          */
        this.password = opts.password || "";
        /**
          * loginExtra is any additional information required by plugins to
          * connect to remote services. What the plugin does with this bit of info
          * is its own business. For example, a plugin that requires the path to
          * a local private key file can ask the user to enter the path to that
          * file here.
          *
          * @type {string}
          */
        this.loginExtra = opts.loginExtra || "";
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
        if (Util.isEmpty(this.protocol)) {
            this.errors["protocol"] = "Protocol cannot be empty.";
        }
        if (Util.isEmpty(this.host)) {
            this.errors["host"] = "Host cannot be empty.";
        }
        if (!Util.isEmpty(this.port) && this.port != 0 && parseInt(this.port, 10) != this.port) {
            this.errors["port"] = "Port must be a whole number, or leave at zero to use the default port.";
        }
        return Object.keys(this.errors).length == 0;
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
        let data = Context.db('UploadTarget').get(id);
        if (data) {
            return new UploadTarget(data);
        }
        return undefined;
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
        return PersistentObject.sort(Context.db('UploadTarget'), property, direction);
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
        return PersistentObject.findMatching(Context.db('UploadTarget'), property, value, opts);
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
        return PersistentObject.firstMatching(Context.db('UploadTarget'), property, value, opts);
    }

    /**
     * list returns an array of items matched by the filter function.
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {filterFunction} filterFunction - A function to filter out items that should not go into the results.
     * @param {Object} opts - Optional additional params.
     * @param {number} opts.limit - Limit to this many results.
     * @param {number} opts.offset - Start results from this offset.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     *
     * @returns {Object[]}
     */
    static list(filterFunction, opts) {
        return PersistentObject.list(Context.db('UploadTarget'), filterFunction, opts);
    }

    /**
     * first returns the first item matching that passes the filterFunction.
     * You can combine orderBy, sortDirection, and offset to get the second, third, etc.
     * match for the given criteria, but note that this function only returns a
     * single item at most (or null if there are no matches).
     *
     * @see {@link PersistentObject} for examples.
     *
     * @param {filterFunction} filterFunction - A function to filter out items that should not go into the results.
     * @param {Object} opts - Optional additional params.
     * @param {string} opts.orderBy - Sort the list on this property.
     * @param {string} opts.sortDirection - Sort the list 'asc' (ascending) or 'desc'. Default is asc.
     * @param {number} opts.offset - Skip this many items before choosing a result.
     *
     * @returns {Object}
     */
    static first(filterFunction, opts) {
        return PersistentObject.first(Context.db('UploadTarget'), filterFunction, opts);
    }

}

module.exports.UploadTarget = UploadTarget;
