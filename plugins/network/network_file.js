/**
 * NetworkFile contains information about files or object
 * in an remote S3 or SFTP {@link StorageService}.
 *
 */
class NetworkFile {
    /**
     * Creates a new NetworkFile object.
     */
    constructor() {
        /**
         * The name of the remote file or object. 
         * 
         * @type {string}
         */
        this.name = ""

        /**
         * The size, in bytes, of the remote file or object.
         * 
         * @type {number}
         */
        this.size = 0

        /**
         * The etag of the remote object. This will always be
         * empty when listing sftp files. It's an s3-only attribute.
         * 
         * @type {string}
         */
        this.etag = ""

        /**
         * The file's last modification timestamp. This may be empty,
         * depending on the remote service. Some sftp servers may return
         * a Unix timestamp, which is the number of seconds or milliseconds 
         * since Jan 1, 1970. S3 services will typically return a timestamp
         * in ISO 8601 format.
         * 
         * @type {number|string|Date}
         */
        this.lastModified = 0
    }
}

module.exports.NetworkFile = NetworkFile
