const Templates = require('../common/templates');

class StorageServiceController {

    constructor(setup) {
        this.setup = setup;
    }

    create() {
        return 'Create StorageService';
    }

    update() {
        return 'Update StorageService';
    }

    list() {
        return 'List StorageService';
    }

    destroy() {
        return 'Destroy StorageService';
    }
}

module.exports.StorageServiceController = StorageServiceController;
