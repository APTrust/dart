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
         * depending on the remote service. 
         * 
         * @type {Date}
         */
        this.lastModified = new Date(0)
    }
}

module.exports.NetworkFile = NetworkFile
