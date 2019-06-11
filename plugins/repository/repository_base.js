const { Plugin } = require('../plugin');

class RepositoryBase extends Plugin {
    constructor(remoteRepository) {
        super();
        this.repo = remoteRepository;
    }

    provides() {
        throw new Error('This method must be implemented in the subclass.');
    }

    hasRequiredConnectionInfo() {
        throw new Error('This method must be implemented in the subclass.');
    }
}

module.exports.RepositoryBase = RepositoryBase;
