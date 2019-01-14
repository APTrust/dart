const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

class RemoteRepositoryController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
    }

    create() {
        return this.containerContent('Create RemoteRepository');
    }

    update() {
        return this.containerContent('Update RemoteRepository');
    }

    list() {
        return this.containerContent('List RemoteRepository');
    }

    destroy() {
        return this.containerContent('Destroy RemoteRepository');
    }
}

module.exports.RemoteRepositoryController = RemoteRepositoryController;
