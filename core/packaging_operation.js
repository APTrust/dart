const { ValidationResult } = require('./validation_result');
const { Util } = require('./util');

/**
 * PackagingOperation contains information describing a number of files
 * to be packaged, what format they should be packed into, and where the
 * final output should be stored.
 *
 */
class PackagingOperation {
    /**
     * Creates a new PackagingOperation.
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
    }

    /**
     * validate returns a ValidationResult that describes what if anything
     * is not valid about this PackagingOperation.
     *
     * @returns {ValidationResult} - The result of the validation check.
     */
    validate() {
        var result = new ValidationResult();
        if (typeof this.packageName != 'string' || Util.isEmpty(this.packageName)) {
            result.errors.push('PackageOperation requires a package name.');
        }
        if (typeof this.outputPath != 'string' || Util.isEmpty(this.outputPath)) {
            result.errors.push('PackageOperation requires an output path.');
        }
        if (!Array.isArray(this.sourceFiles) || Util.isEmptyStringArray(this.sourceFiles)) {
            result.errors.push('PackageOperation requires at least one source file or directory to package.');
        }
        return result;
    }
}

module.exports.PackagingOperation = PackagingOperation;
