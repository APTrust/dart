const fs = require('fs');
const { OperationResult } = require('../../core/operation_result');

/**
 * S3Transfer keeps track of information about an upload or
 * download operation being performed by the S3Client plugin.
 * It also contains the {@link OperationResult} record that the
 * {@link S3Client} will return when it emits its finish event.
 *
 * There is some overlap between info contained in an S3Transfer
 * and the info in an {@link OperationResult}. The S3Transfer
 * record is for the {@link S3Client|S3Client's} internal use,
 * and includes information that is not useful to any other plugin.
 *
 * The {@link OperationResult} is an object intended to be returned
 * or emitted by many plugins to describe the outcode of their work
 * in a uniform manner.
 *
 */
class S3Transfer {
    /**
     * Creates a new S3Transfer object.
     *
     * @param {string} operation - The name of the operation that the
     * S3Client will perform. This should be 'upload' or 'download'.
     *
     * @param {string} provider - The name of the provilder (Plugin)
     * performing the operation.
     */
    constructor(operation, provider) {
        /**
         * The name of the S3 operation. This should be either
         * 'upload' or 'download'.
         *
         * @type {string}
         */
        this.operation = operation;
        /**
         * The name or IP address of the S3 host.
         *
         * @type {string}
         */
        this.host = '';
        /**
         * The port number of the S3 host that our client should
         * connect to. You can usually leave this blank.
         *
         * @type {number}
         */
        this.port = null;
        /**
         * The name of the bucket on the S3 server to which we should
         * upload or from which we should download.
         *
         * @type {string}
         */
        this.bucket = '';
        /**
         * The name of the key (a.k.a the object name) on the S3 server
         * that we want to put or get.
         *
         * @type {string}
         */
        this.key = '';
        /**
         * The path to the file on the locally mounted filesystem that
         * we want to upload to S3 in an upload operation. For downloads,
         * this is the path to which we'll save the S3 object we retrieve.
         *
         * @type {string}
         */
        this.localPath = '';
        /**
         * An fs.stats object describing the size, mtime, uid, etc. of the
         * file at localPath. For uploads, this will be set before the
         * upload begins. For downloads, it will be set after the download
         * completes.
         *
         * @type {fs.stats}
         */
        this.localStat = null;
        /**
         * An object describing the size and etag of an object uploaded to
         * S3. For uploads, this will be set after the upload completes.
         * For downloads, it will remain null.
         *
         * @type {fs.stats}
         */
        this.remoteStat = null;
        /**
         * The etag of a file uploaded to S3. This will be set after the
         * upload completes. For downloads, it will remain null.
         *
         * @type {string}
         */
        this.etag = '';
        /**
         * The last error to occur during an operation by the S3 client.
         * For a full list of errors, check the result.errors list.
         *
         * @type {string}
         */
        this.error = null;
        /**
         * An object describing the outcome of an upload or download
         * operation, including any errors that may have occurred.
         *
         * @type {OperationResult}
         */
        this.result = new OperationResult(operation, provider);
    }

    /**
     * This returns the URL of the object on the S3 server that we are
     * trying to upload or download.
     *
     * @returns {string}
     */
    getRemoteUrl() {
        let url = 'https://' + this.host.replace('/','');
        if (this.port) {
            url += `:${this.port}`;
        }
        url += `/${this.bucket}/${this.key}`;
        return url;
    }

}

module.exports.S3Transfer = S3Transfer;
