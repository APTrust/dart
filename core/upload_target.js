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
     * to the remote repo ('s3', 'sftp', etc.).
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
        opts.required = ["name", "protocol", "host"];
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
     * Returns the url to which files will be uploaded.
     *
     * @returns {string}
     */
    url(filename = '') {
        // TODO: Branch for protocols that construct URLs differently.
        let portString = this.port ? `:${this.port}` : '';
        return `${this.protocol}://${this.host}${portString}/${this.bucket}/${filename}`
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
        if (!Util.isEmpty(this.port) && this.port != 0 && parseInt(this.port, 10) != this.port) {
            this.errors["port"] = "Port must be a whole number, or leave at zero to use the default port.";
        }
        return Object.keys(this.errors).length == 0;
    }
}

// Get static methods from base class.
Object.assign(UploadTarget, PersistentObject);

module.exports.UploadTarget = UploadTarget;
