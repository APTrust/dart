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
     * @param {string} outputFormat - A file extension describing the format
     * in which the output should be written. For example, '.tar', '.zip',
     * 'directory'.
     *
     */
    constructor(packageName, outputPath, outputFormat) {
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
         * The file extension of the format DART is packaging. For example,
         * '.tar', '.zip', '.tgz', etc. If the output format is a directory,
         * this should be 'directory'.
         *
         * @type {string}
         */
        this.outputFormat = outputFormat;
        /**
         * A list of files DART will be packaging. Each entry in this list
         * should be an absolute path.
         *
         * @type {Array<string>}
         */
        this.sourceFiles = [];
        /**
         * The id of the BagItProfile that describes how to package the
         * bag that DART will create. This should be a UUID that
         * BagItProfile.find() can look up in the local data store.
         *
         * If this is null, DART will assume no bagging is necessary before
         * packaging the files into the requested format. If this is
         * non-empty and DART cannot find a BagItProfile with the specified
         * id, DART will raise an exception.
         *
         * @type {string}
         */
        this.bagItProfileId = null;
        /**
         * This describes the result of DART's attempt to package the files.
         *
         * @type {OperationResult}
         */
        this.operationResult = null;
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
}

module.exports.PackagingOperation = PackagingOperation;
