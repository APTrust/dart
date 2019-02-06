const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');
const { RemoteRepository } = require('../../core/remote_repository');
const { RemoteRepositoryForm } = require('../forms/remote_repository_form');

const typeMap = {
    userCanDelete: 'boolean'
}

class RemoteRepositoryController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.typeMap = typeMap;

        this.model = RemoteRepository;
        this.formClass = RemoteRepositoryForm;
        this.formTemplate = Templates.remoteRepositoryForm;
        this.listTemplate = Templates.remoteRepositoryList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'name';
        this.defaultSortDirection = 'asc';
    }

}

module.exports.RemoteRepositoryController = RemoteRepositoryController;
