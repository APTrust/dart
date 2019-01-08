const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class StorageServiceController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
    }

    create() {
        return this.containerContent('Create StorageService');
    }

    update() {
        return this.containerContent('Update StorageService');
    }

    list() {
        return this.containerContent('List StorageService');
    }

    destroy() {
        return this.containerContent('Destroy StorageService');
    }
}

module.exports.StorageServiceController = StorageServiceController;
