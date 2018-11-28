const { Plugin } = require('../plugin');

/**
 * APTrustSetup provides a walk-through setup for DART users
 * to create a basic APTrust environment.
 *
 *
 */
module.exports = class APTrustSetup extends Plugin {
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
            id: 'd0a34f7f-a0f6-487b-86de-ece9b9a31189',
            name: 'APTrustSetup',
            description: 'APTrust setup module. This helps users set up a basic APTrust configuration.',
            version: '0.1',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: ['aptrust']
        };
    }

}
