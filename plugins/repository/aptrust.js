const { Plugin } = require('../plugin');

/**
 * APTrustClient provides methods for querying an APTrust repository
 * that conform to the DART repository interface.
 *
 *
 */
class APTrustClient extends Plugin {
    /**
     *
     */
    constructor() {
        super();
    }

    /**
     * Returns a {@link PluginDefinition} object describing this plugin.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: 'c5a6b7db-5a5f-4ca5-a8f8-31b2e60c84bd',
            name: 'APTrustClient',
            description: 'APTrust repository client. This allows DART to talk to the APTrust demo and/or production repository.',
            version: '0.1',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: [],
            talksToRepository: ['aptrust'],
            setsUp: []
        };
    }
}

module.exports = APTrustClient;
