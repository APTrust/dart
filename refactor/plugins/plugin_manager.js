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
     * This returns a list of all plugins of the specified type.
     * For example, listByType('FormatWriter') returns a list of all
     * plugins of type FormatWriter.
     *
     * @returns {Array<Plugin>}
     */
    static listByType(type) {

    }

    /**
     * This returns the plugin with the specified id.
     *
     * @returns {Plugin}
     */
    static findById(id) {

    }

    /**
     * This returns a list of all plugins that can read the specified
     * file extension. For example, canRead('.tar') returns a list of
     * plugins that can read tar files. Use 'filesystem' if you're
     * looking for plugins that can read from the file system.
     *
     * @returns {Array<Plugin>}
     */
    static canRead(fileExtension) {

    }

    /**
     * This returns a list of all plugins that can write the specified
     * file extension. For example, canWrite('.tar') returns a list of
     * plugins that can write tar files. Use 'filesystem' if you're
     * looking for plugins that can write to the file system.
     *
     * @returns {Array<Plugin>}
     */
    static canWrite(fileExtension) {

    }

    /**
     * This returns a list of all plugins that implement the specified
     * network protocol. For example, implementsProtocol('s3') returns a
     * list of plugins that can talk to s3 servers.
     *
     * @returns {Array<Plugin>}
     */
    static implementsProtocol(proto) {

    }

    /**
     * This returns a list of all plugins that can talk to repositories
     * of the specified type. For example, talksTo('fedora') returns a
     * list of plugins that can talk to Fedora REST services.
     *
     * @returns {Array<Plugin>}
     */
    static talksTo(repoType) {

    }
}
