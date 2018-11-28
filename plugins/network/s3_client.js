const { Plugin } = require('../plugin');

// This is a stub to be filled in later.

module.exports = class S3Client extends Plugin {
    constructor() {
        super();
    }

    static description() {
        return {
            id: '23a8f0af-a03a-418e-89a4-6d07799882b6',
            name: 'S3Client',
            description: 'Built-in DART S3 network client',
            version: '0.1',
            readsFormats: [],
            writesFormats: [],
            implementsProtocols: ['s3'],
            talksToRepository: [],
            setsUp: []
        };
    }

}
