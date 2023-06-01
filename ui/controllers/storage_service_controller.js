const { BaseController } = require('./base_controller');
const { StorageService } = require('../../core/storage_service');
const { StorageServiceForm } = require('../forms/storage_service_form');
const Templates = require('../common/templates');

// This allows us to convert query string params
// to their proper types. No need to specify strings, since
// they don't need to be converted.
const typeMap = {
    userCanDelete: 'boolean',
    port: 'number'
}

class StorageServiceController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.typeMap = typeMap;

        this.model = StorageService;
        this.formClass = StorageServiceForm;
        this.formTemplate = Templates.storageServiceForm;
        this.listTemplate = Templates.storageServiceList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'name';
        this.defaultSortDirection = 'asc';
    }

}

module.exports.StorageServiceController = StorageServiceController;
