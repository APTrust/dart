const { Plugin } = require('../plugin');

// This is a stub to be filled in later.

module.exports = class APTrust extends Plugin {
    constructor() {
        super();
    }

    static description() {
        return {
            id: 'd0a34f7f-a0f6-487b-86de-ece9b9a31189',
            name: 'APTrust',
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
