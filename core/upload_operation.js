const { Context } = require('./context');
const { OperationResult } = require('./operation_result');
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
     * @param {string} uploadTargetId - The id of the {@link UploadTarget}
     * to which we'll be sending files.
     *
     * @param {string} sourceFiles - A list of files to upload. Each entry
     * in this list should be an absolute path.
     *
     */
    constructor(uploadTargetId, sourceFiles) {
        /**
         * The ID (UUID) of the {@link UploadTarget} to which we want to
         * send files.
         *
         * @type {string}
         */
        this.uploadTargetId = uploadTargetId;
        /**
         * A list of files to upload. Each entry in this list should be an
         * absolute path.
         *
         * @type {Array<string>}
         */
        this.sourceFiles = sourceFiles || [];
        /**
         * This describes the result of DART's attempt to upload the files.
         *
         * @type {OperationResult}
         */
        this.results = [];
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
        if (!Util.looksLikeUUID(this.uploadTargetId)) {
            this.errors['UploadOperation.uploadTargetId'] = Context.y18n.__('You must specify an upload target.');
        }
        if (!Array.isArray(this.sourceFiles) || Util.isEmptyStringArray(this.sourceFiles)) {
            this.errors['UploadOperation.sourceFiles'] = Context.y18n.__('Specify at least one file or directory to upload.');
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * This converts the JSON representation of an UploadOperation to a
     * full-fledged UploadOperation object with all of the expected methods.
     *
     * @param {Object} data - A JavaScript hash.
     *
     * @returns {UploadOperation}
     */
    static inflateFrom(data) {
        let op = new UploadOperation();
        Object.assign(op, data);
        if (data.result) {
            op.result = OperationResult.inflateFrom(data.result);
        }
        return op;
    }
}

module.exports.UploadOperation = UploadOperation;
