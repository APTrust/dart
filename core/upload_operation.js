/**
 * UploadOperation contains information describing a number of files
 * to be uploaded and where they should be sent.
 *
 */
class UploadOperation {
    /**
     * Creates a new UploadOperation.
     *
     * @param {string} destination - The destination to which files should
     * be uploaded. This should be a URL or hostname.
     *
     * @param {string} protocol - The network protocol to use when uploading
     * files. For example, 's3', 'ftp', 'sftp', etc.
     *
     * @param {string} sourceFiles - A list of files to upload. Each entry
     * in this list should be an absolute path.
     *
     */
    constructor(destination, protocol, sourceFiles) {
        /**
         * The destination to which sourceFiles should be uploaded. This should
         * be a URL or hostname.
         *
         * @type {string}
         */
        this.destination = destination;
        /**
         * The network protocol to use when uploading files. For example, 's3',
         * 'ftp', 'sftp', etc.
         *
         * @type {string}
         */
        this.protocol = protocol;
        /**
         * A list of files to upload. Each entry in this list should be an
         * absolute path.
         *
         * @type {Array<string>}
         */
        this.sourceFiles = sourceFiles;
        /**
         * This describes the result of DART's attempt to upload the files.
         *
         * @type {OperationResult}
         */
        this.result = null;
        /**
         * The total size, in bytes, of the files to be uploaded.
         *
         * @type {OperationResult}
         */
        this.payloadSize = 0;
    }
}

module.exports.UploadOperation = UploadOperation;
