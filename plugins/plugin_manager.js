const FormatReaders = require("./formats/read");
const FormatWriters = require("./formats/write");
const NetworkClient = require("./network");
const Repository = require("./repository");
const Setup = require("./setup");
const { Util } = require('../core/util');

/**
 * pluginTypes describe the types of DART plugins.
 *
 * - FormatReader reads files of a specific format. For example,
 *   TarReader reads tar files and FileSystemReader reads files directly
 *   from the file system.
 * - FormatWriter writes files in a specific format. For example,
 *   TarReader writes tar files and FileSystemReader writes files directly
 *   to the file system.
 * - NetworkClient sends (and possibly retrieves) files across a network.
 *   For example, S3Client can upload files to any service that implements
 *   the S3 REST API. FTPClient (when someone writes it) can upload files
 *   to an FTP server.
 * - Repository services can query different types of repositories. For
 *   example, an APTrust repository plugin can tell you the status of objects
 *   uploaded to APTrust. A Fedora plugin (if someone writes one) could do the
 *   same by talking to a Fedora REST service.
 * - Setup provides a simple walk-through setup for a repository backend.
 *
 */
const pluginTypes = ['FormatReader', 'FormatWriter', 'NetworkClient', 'Repository', 'Setup'];

/**
 * PluginManager keeps track of available plugins and helps the DART core find
 * the plugins it needs to complete a job. For example, if a job requires that
 * we packaged a bag into a tar file and then send it via FTP to some remote
 * server, the plugin manager will find the plugins capable of writing tar files
 * and talking to FTP servers.
 *
 */
class PluginManager {

    /**
     * This returns a list of plugin types. E.g. 'FormatReader',
     * 'FormatWriter', etc.
     *
     * @returns {Array<string>}
     */
    static types() {
        return pluginTypes;
    }

    /**
     * This returns a list of available plugins of the specified
     * type. This function is primarily meant for internal use.
     * You'll generally want to use {@link listByType} to get an
     * alphabetically ordered list of plugin descriptions.
     *
     * @returns {Array<Plugin>}
     */
    static getModuleCollection(type) {
        var modules;
        switch (type) {
            case 'FormatReader':
              modules = FormatReaders.Providers;
              break;
            case 'FormatWriter':
              modules = FormatWriters.Providers;
              break;
            case 'NetworkClient':
              modules = NetworkClient.Providers;
              break;
            case 'Repository':
              modules = Repository.Providers;
              break;
            case 'Setup':
              modules = Setup.Providers;
              break;
            default:
              throw `Param 'type' must be one of: Array.join(pluginTypes, ', ')`;
        }
        return modules;
    }

    /**
     * This returns a list of all plugins of the specified type.
     * For example, listByType('FormatWriter') returns a list of all
     * plugins of type FormatWriter.
     *
     * @returns {Array<Plugin>}
     */
    static listByType(type) {
        var modules = PluginManager.getModuleCollection(type);
        var providers = [];
        for(var module in modules) {
            providers.push(module.description());
        }
        providers.sort(Util.getSortFunction('name', 'asc'));
        return providers;
    }

    /**
     * This returns the plugin with the specified id.
     *
     * @returns {Plugin}
     */
    static findById(id) {
        for (var pluginType of pluginTypes) {
            var modules = PluginManager.getModuleCollection(pluginType);
            for (var module of modules) {
                if (module.description().id == id) {
                    return module;
                }
            }
        }
        return null;
    }

    /**
     * This returns a list of all plugins that can read the specified
     * file extension. For example, canRead('.tar') returns a list of
     * plugins that can read tar files. Use 'filesystem' if you're
     * looking for plugins that can read from the file system.
     *
     * @param {string} fileExtension - A string specifying the extension
     * of the file type you want to read. This should be all lowercase,
     * such as '.tar', '.zip', etc.
     *
     * @returns {Array<Plugin>}
     */
    static canRead(fileExtension) {
        return PluginManager.pluginProvides('FormatReader', 'readsFormats', fileExtension)
    }

    /**
     * This returns a list of all plugins that can write the specified
     * file extension. For example, canWrite('.tar') returns a list of
     * plugins that can write tar files. Use 'filesystem' if you're
     * looking for plugins that can write to the file system.
     *
     * @param {string} fileExtension - A string specifying the extension
     * of the file type you want to write. This should be all lowercase,
     * such as '.tar', '.zip', etc.
     *
     * @returns {Array<Plugin>}
     */
    static canWrite(fileExtension) {
        return PluginManager.pluginProvides('FormatWriter', 'writesFormats', fileExtension)
    }

    /**
     * This returns a list of all plugins that implement the specified
     * network protocol. For example, implementsProtocol('s3') returns a
     * list of plugins that can talk to s3 servers.
     *
     * @param {string} protocol - A string specifying what network protocol
     * you want to use. This should be all lowercase, such as 'ftp', 'sftp',
     * 's3', etc.
     *
     * @returns {Array<Plugin>}
     */
    static implementsProtocol(proto) {
        return PluginManager.pluginProvides('NetworkClient', 'implementsProtocols', proto)
    }

    /**
     * This returns a list of all plugins that can talk to repositories
     * of the specified type. For example, talksTo('fedora') returns a
     * list of plugins that can talk to Fedora REST services.
     *
     * @param {string} repoType - A string specifying what kind of repository
     * you want to talk to. This should be all lowercase, such as 'aptrust',
     * 'fedora', etc.
     *
     * @returns {Array<Plugin>}
     */
    static talksTo(repoType) {
        return PluginManager.pluginProvides('Repository', 'talksToRepository', repoType)
    }

    /**
     * This returns a list of all plugins that provide setup services for
     * the specified configuration. For example, 'aptrust' provides setup
     * services to get the basic APTrust configuration in place.
     *
     * @param {string} what - A string specifying what kind of setup you're
     * looking for. This should be all lowercase, such as 'aptrust'.
     *
     * @returns {Array<Plugin>}
     */
    static setsUp(what) {
        return PluginManager.pluginProvides('Setup', 'setsUp', what)
    }

    /**
     * This returns a list of plugins that provide a certain service,
     * such as being able to read a specified format or communicate via a
     * specific network protocol. This function is used internally by the
     * convenience functions {@link canRead}, {@link canWrite},
     * {@link implementsProtocol}, {@link talksTo}, and {@link setsUp}.
     * You should generally use those functions instead of this one.
     *
     *
     *
     * @returns {Array<Plugin>}
     */
    static pluginProvides(pluginType, propertyToCheck, valueToFind) {
        var modules = PluginManager.getModuleCollection(pluginType);
        var providers = [];
        for (var module of modules) {
            var desc = module.description();
            if (Array.isArray(desc[propertyToCheck]) && desc[propertyToCheck].includes(valueToFind)) {
                providers.push(module);
            } else if (desc[propertyToCheck] === valueToFind) {
                providers.push(module);
            }
        }
        return providers;
    }
}

module.exports.PluginManager = PluginManager;
