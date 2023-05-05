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
     * @param {object} opts - Object containing properties to set.
     *
     * @param {string} opts.name - The name of the setting. This should be
     * unique, to prevent conflicts.
     *
     * @param {string} opts.url - The url of the remote repository.
     *
     * @param {string} opts.userId - The user id required to log in to
     * the remote repository.
     *
     * @param {string} opts.id - A UUID in hex-string format. This is
     * the object's unique identifier.
     *
     * @param {boolean} opts.userCanDelete - Indicates whether user is
     * allowed to delete this record.
     *
     * @param {string} opts.apiToken - The API token to authenticate with
     * the remote repository.
     *
     * @param {object} opts.loginExtra - Extra information required to
     * authenticate with the remote repo.
     *
     * @param {string} opts.pluginId - The UUID that identifies the plugin
     * that lets us connect to the remote repo.
     *
     */
    constructor(opts = {}) {
        opts.required = ['name'];
        super(opts);
        /**
          * Name is the name of the remote repo. This should be
          * descriptive, like "APTrust Demo Repository", "APTrust
          * Production Repository," etc.
          *
          * @type {string}
          */
        this.name = opts.name || "";
        /**
          * The URL that runs the remote repository's REST service.
          *
          * @type {string}
          */
        this.url = opts.url || "";
        /**
          * The User ID used to connect to the repository's REST services.
          * This is optional, and will often be blank, as most REST
          * services require only an API token to connect.
          *
          * @type {string}
          */
        this.userId = opts.userId || "";
        /**
          * The API token required to connect to the remote repository's
          * REST service.
          *
          * @type {string}
          */
        this.apiToken = opts.apiToken || "";
        /**
          * Optional additional information required to connect to the
          * remote REST service. Most services won't use this.
          *
          * @type {string}
          */
        this.loginExtra = opts.loginExtra || "";
        /**
          * The UUID of the DART plugin that provides access to the REST
          * service. You cannot connect to any remote REST service without
          * a plugin.
          *
          * @type {string}
          */
        this.pluginId = opts.pluginId || "";
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
        if (!Util.looksLikeHypertextURL(this.url)) {
            this.errors["url"] = "Repository URL must a valid URL beginning with http:// or https://.";
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * This converts a generic object into an RemoteRepository
     * object. this is useful when loading objects from JSON.
     *
     * @param {object} data - An object you want to convert to
     * a RemoteRepository.
     *
     * @returns {RemoteRepository}
     *
     */
    static inflateFrom(data) {
        let setting = new RemoteRepository();
        Object.assign(setting, data);
        return setting;
    }

}

// Copy static methods from base class.
Object.assign(RemoteRepository, PersistentObject);

module.exports.RemoteRepository = RemoteRepository;
