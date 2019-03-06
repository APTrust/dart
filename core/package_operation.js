const { Context } = require('./context');
const fs = require('fs');
const { OperationResult } = require('./operation_result');
const { Util } = require('./util');

/**
 * PackageOperation contains information describing a number of files
 * to be packaged, what format they should be packed into, and where the
 * final output should be stored.
 *
 */
class PackageOperation {
    /**
     * Creates a new PackageOperation.
     *
     * @param {string} packageName - The name of the package to create.
     * Typically, this is the name of a bag, excluding any '.tar', '.zip'
     * or other file format extension.
     *
     * @param {string} outputPath - The absolute path to which the package
     * should be written.
     *
     *
     */
    constructor(packageName, outputPath) {
        /**
         * The name of the package. Usually, this will be a bag name,
         * and should not include a file extension.
         *
         * @type {string}
         */
        this.packageName = packageName;
        /**
         * The absolute path to the file or directory in which to put the
         * completed package. In other words the absolute path to the
         * final .tar, .zip, or other file DART is creating. If DART is
         * writing a bag to a directory, this path should point to that
         * directory.
         *
         * @type {string}
         */
        this.outputPath = outputPath;
        /**
         * A list of files DART will be packaging. Each entry in this list
         * should be an absolute path.
         *
         * @type {Array<string>}
         */
        this.sourceFiles = [];
        /**
         * This describes the result of DART's attempt to package the files.
         *
         * @type {OperationResult}
         */
        this.result = null;
        /**
         * The total size, in bytes, of the files to be packaged.
         *
         * @type {OperationResult}
         */
        this.payloadSize = 0;
        /**
         * This is a list of patterns that DART should skip when creating this
         * package. Any files matching these patterns will not be packaged.
         *
         * See {@link Constants.RE_DOT_FILES} and
         * {@link Constants.RE_MAC_JUNK_FILES}.
         *
         * @type {Array<string>}
         */
        this.skipFiles = [];
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
        if (typeof this.packageName != 'string' || Util.isEmpty(this.packageName)) {
            this.errors['PackageOperation.packageName'] = 'Package name is required.';
        }
        if (typeof this.outputPath != 'string' || Util.isEmpty(this.outputPath)) {
            this.errors['PackageOperation.outputPath'] = 'Output path is required.';
        }
        if (!Array.isArray(this.sourceFiles) || Util.isEmptyStringArray(this.sourceFiles)) {
            this.errors['PackageOperation.sourceFiles'] = 'Specify at least one file or directory to package.';
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * This removes items from the sourceFiles array if they no longer
     * exist on disk. We need to do that to prevent errors when the job
     * runs, as well as rendering errors in the UI. It logs items that
     * it removes.
     *
     * This won't prune the list if the PackageOperation has already
     * been completed, because in that case, we want a record of what
     * the operation actually did package. It's also expected that some
     * source files will be deleted after a job has run.
     */
    pruneSourceFilesUnlessJobCompleted() {
        if (this.result && this.result.succeeded()) {
            return;
        }
        // Iterate backwards, so the deletion doesn't throw off
        // the iterator.
        for (let i = this.sourceFiles.length; i > -1; i--) {
            let filepath = this.sourceFiles[i];
            if (!fs.existsSync(filepath)) {
                Context.logger.info(`Removing ${filepath} from items to be packaged into ${this.packageName} because it no longer exists on the filesystem.`);
                this.sourceFiles.splice(i, 1);
            }
        }
    }

    /**
     * This converts the JSON representation of a PackageOperation to a
     * full-fledged PackageOperation object with all of the expected methods.
     *
     * @param {Object} data - A JavaScript hash.
     *
     * @returns {PackageOperation}
     */
    static inflateFrom(data) {
        // let op = "pay attention" in Dutch.
        let op = new PackageOperation();
        Object.assign(op, data);
        if (data.result) {
            op.result = OperationResult.inflateFrom(data.result);
        }
        return op;
    }
}

module.exports.PackageOperation = PackageOperation;
