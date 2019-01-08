const ejs = require('ejs');
const { UI } = require('../common/ui');

const Form = UI.templates.storageServiceForm;
const List = UI.templates.storageServiceList;

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
