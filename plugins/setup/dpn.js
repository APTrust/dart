/**
 * DPNSetup provides a walk-through setup for DART users
 * to create a basic DPN environment.
 *
 */
class DPNSetup extends Plugin {

    constructor() {
        super(__dirname);
    }

    /**
     * Returns a {@link PluginDefinition} object describing this plugin.
     *
     * @returns {PluginDefinition}
     */
    static description() {
        return {
            id: 'ba6cf526-f73a-454c-b0b3-6378edc3851a',
            name: 'DPNSetup',
            description: Context.y18n.__('DPN setup module. This helps users set up a basic DPN configuration.'),
            version: '0.1',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: ['dpn']
        };
    }
}

module.exports = DPNSetup;
