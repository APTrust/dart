const { Plugin } = require('../plugin');

// This is a stub to be filled in later.

module.exports = class APTrust extends Plugin {
    constructor() {
        super();
    }

    static description() {
        return {
            id: 'c5a6b7db-5a5f-4ca5-a8f8-31b2e60c84bd',
            name: 'APTrust',
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
