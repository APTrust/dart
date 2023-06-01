const { Context } = require('./context');
const fs = require('fs');
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
     * @param {string} storageServiceId - The id of the {@link StorageService}
     * to which we'll be sending files.
     *
     * @param {string} sourceFiles - A list of files to upload. Each entry
     * in this list should be an absolute path.
     *
     */
    constructor(storageServiceId, sourceFiles) {
        /**
         * The ID (UUID) of the {@link StorageService} to which we want to
         * send files.
         *
         * @type {string}
         */
        this.storageServiceId = storageServiceId;
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
        if (!Util.looksLikeUUID(this.storageServiceId)) {
            this.errors['UploadOperation.storageServiceId'] = Context.y18n.__('You must specify a storage service.');
        }
        if (!Array.isArray(this.sourceFiles) || Util.isEmptyStringArray(this.sourceFiles)) {
            this.errors['UploadOperation.sourceFiles'] = Context.y18n.__('Specify at least one file or directory to upload.');
        }
        let missingFiles = [];
        for (let sourceFile of this.sourceFiles) {
            if (!fs.existsSync(sourceFile)) {
                missingFiles.push(sourceFile);
            }
        }
        if (missingFiles.length > 0) {
            this.errors['UploadOperation.sourceFiles'] = Context.y18n.__('The following files are missing: %s', missingFiles.join('; '));
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
        for (let i=0; i < data.results.length; i++) {
            op.results[i] = OperationResult.inflateFrom(data.results[i]);
        }
        return op;
    }
}

module.exports.UploadOperation = UploadOperation;
