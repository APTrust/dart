const EventEmitter = require('events');

/**
 * PluginDefinition contains information about what capabilities a plugin
 * provides.
 * @typedef {Object} PluginDefinition
 * @property {string} id - A UUID in string format that uniquely identifies
 *            this plugin.
 * @property {string} name - The name of this plugin.
 * @property {string} description - A human-readable description of this plugin.
 * @property {string} version - The version number of this plugin. E.g. 1.44
 * @property {Array<string>} readsFormats - The file extensions of the types
 *           of files this plugin can read. This applies only to plugins of
 *           type FormatReader. For example, a tar reader plugin may be able
 *           to read types ['.tar', '.tar.gz', '.tgz']. If your plugin is not
 *           a FormatReader, this property should be an empty array. Use all
 *           lowercase letters.
 * @property {Array<string>} writesFormats - The file extensions of the types
 *           of files this plugin can write. This applies only to plugins of
 *           type FormatWriter. For example, a tar writer plugin may be able
 *           to read types ['.tar', '.tar.gz', '.tgz']. If your plugin is not
 *           a FormatWriter, this property should be an empty array. Use all
 *           lowercase letters.
 * @property {Array<string>} implementsProtocols - The network protocols that
 *           this plugin implements. For example, an FTP plugin may implement
 *           ['ftp', 'sftp', 'ftps']. This applies only to plugins of type
 *           NetworkClient. If your plugin is not a NetworkClient, this should
 *           be an empty list. Use all lowercase letters.
 * @property {Array<string>} setsUp - This describes what general configuration
 *           your plugin provides. For example, the 'aptrust' setup plugin helps
 *           the user configure some basic APTrust settings, such as the URL of
 *           the APTrust repository, the user's API keys, etc. This applies only
 *           to plugins of type Setup. If your plugin is not a Setup plugin,
 *           this should be empty. Use all lowercase letters.
 * @property {Array<string>} talksToRepository - This describes what type of
 *           repository your plugin talks to. For example, 'fedora', 'aptrust',
 *           etc. This applies only to plugins of type Repository. If your plugin
 *           is not a Repository plugin, this should be empty. Use all lowercase
 *           letters.
 *
 */


/**
 * Plugin is the base class for all plugins.
 */
class Plugin extends EventEmitter {
    constructor() {
        super();
    }

    /**
     * The description method returns a description of the plugin and its
     * capabilities.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: '',
            name: '',
            description: '',
            version: '',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: []
        }
    }
}

module.exports.Plugin = Plugin;
