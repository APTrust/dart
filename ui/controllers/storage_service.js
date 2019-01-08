const Templates = require('../common/templates');

class StorageServiceController {

    constructor(storageService) {
        this.storageService = storageService;
    }

    create() {
        return 'Create StorageService';
    }

    update(params) {
        return 'Update StorageService';
    }

    list(params) {
        return 'List StorageService';
    }

    destroy() {
        return 'Destroy StorageService';
    }
}

module.exports.StorageServiceController = StorageServiceController;
