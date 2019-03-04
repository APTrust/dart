const { Util } = require('./util');

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
        /**
         * Contains information describing validation errors. Key is the
         * name of the invalid field. Value is a description of why the
         * field is not valid.
         *
         * @type {Object<string, string>}
         */
        this.errors = {};
    }

    /**
     * validate returns true or false, indicating whether this object
     * contains complete and valid data. If it returns false, check
     * the errors property for specific errors.
     *
     * @returns {boolean}
     */
    validate() {
        this.errors = {};
        if (typeof this.destination != 'string' || Util.isEmpty(this.destination)) {
            this.errors['UploadOperation.destination'] = 'Destination is required.';
        }
        if (typeof this.protocol != 'string' || Util.isEmpty(this.protocol)) {
            this.errors['UploadOperation.protocol'] = 'Protocol is required.';
        }
        if (!Array.isArray(this.sourceFiles) || Util.isEmptyStringArray(this.sourceFiles)) {
            this.errors['UploadOperation.sourceFiles'] = 'Specify at least one file or directory to upload.';
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * This converts the JSON representation of a UploadOperation to a
     * full-fledged UploadOperation object with all of the expected methods.
     *
     * @param {Object} data - A JavaScript hash.
     *
     * @returns {UploadOperation}
     */
    static inflateFrom(data) {
        let op = new UploadOperation();
        Object.assign(packageOp, data);
        if (data.result) {
            let result = new OperationResult();
            Object.assign(result, data.result);
        }
        return op;
    }

}

module.exports.UploadOperation = UploadOperation;
