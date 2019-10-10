const { Context } = require('./context');
const fs = require('fs');
const { OperationResult } = require('./operation_result');
const { PluginManager } = require('../plugins/plugin_manager');
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
         * The format of the output package. E.g. '.tar', 'directory', etc.
         *
         * DART allows a single plugin to write multiple formats,
         * and several plugins may be able to write the same format.
         * Therefore, packageFormat and packageWriter are specified
         * separately.
         *
         * {@link PluginManager} will return a list of plugins that write
         * various formats. Just call:
         *
         * <code>
         * PluginManager.getModuleCollection('FormatWriter')
         * </code>
         *
         * See also {@see packageWriter}
         *
         * @type {string}
         */
        this.packageFormat = null;
        /**
         * The serialization format of the bag to be produced. This applies
         * only when creating bags. Some profiles include an acceptSerialization
         * attribute describing what types of serialization are allowed.
         * Types typically include 'application/tar', 'application/zip', etc.
         *
         * @type {string}
         */
        this.bagItSerialization = '';
        /**
         * The id (UUID) of the plugin that will write the output package.
         *
         * DART allows a single plugin to write multiple formats,
         * and several plugins may be able to write the same format.
         * Therefore, packageFormat and packageWriter are specified
         * separately.
         *
         * {@link PluginManager} will return a list of plugins that write
         * various formats. Just call:
         *
         * <code>
         * PluginManager.getModuleCollection('FormatWriter')
         * </code>
         *
         * See also {@see packageWriter}
         *
         * @type {string}
         */
        this.pluginId = null;
        /**
         * A list of files DART will be packaging. Each entry in this list
         * should be an absolute path to a file or directory.
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
         * This indicates whether DART should trim common leading paths
         * when packaging files. Let's assume you have the following in
         * {@link sourceFiles}:
         *
         * * '/path/to/some/dir/photos'
         * * '/path/to/some/dir/audios'
         * * '/path/to/some/dir/videos'
         *
         * These all have a common leading path of '/path/to/some/dir',
         * which can be stripped off in the packaging process. So setting
         * trimLeadingPaths to true would lead to these files being bagged
         * as:
         *
         * * 'data/photos'
         * * 'data/audios'
         * * 'data/videos'
         *
         * If trimLeadingPaths is false, these will be bagged as:
         *
         * * 'data/path/to/some/dir/photos'
         * * 'data/path/to/some/dir/audios'
         * * 'data/path/to/some/dir/videos'
         *
         * Note that trimLeadingPaths is useless if the files in {@link
         * sourceFiles} have no common leading path.
         *
         * @type {boolean}
         */
        this.trimLeadingPaths = false;
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
        let missingFiles = [];
        for (let sourceFile of this.sourceFiles) {
            if (!fs.existsSync(sourceFile)) {
                missingFiles.push(sourceFile);
            }
        }
        if (missingFiles.length > 0) {
            this.errors['PackageOperation.sourceFiles'] = Context.y18n.__('The following files are missing: %s', missingFiles.join('; '));
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
     *
     * Warning: The sourceFiles list should contain absolute paths.
     * Relative paths may be trimmed even if they do exist, because
     * the may have been added from a different working directory.
     * Use absolute paths only.
     */
    pruneSourceFilesUnlessJobCompleted() {
        if (this.result && this.result.succeeded()) {
            return;
        }
        if (this.sourceFiles.length == 0) {
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
     * This returns the class of the plugin that will write
     * the package. Note that each time you call this, you'll
     * get a new writer.
     *
     * If this PackageOperation has no pluginId, or an ID that does not
     * match any known plugin, this returns null.
     *
     * @returns {Plugin}
     */
    getWriter() {
        let writer = null;
        if (this.pluginId) {
            let writerClass = PluginManager.findById(this.pluginId);
            writer = new writerClass(this.outputPath);
        }
        return writer;
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
