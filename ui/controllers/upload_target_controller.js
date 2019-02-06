const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');
const { UploadTarget } = require('../../core/upload_target');
const { UploadTargetForm } = require('../forms/upload_target_form');

// This allows us to convert query string params
// to their proper types. No need to specify strings, since
// they don't need to be converted.
const typeMap = {
    userCanDelete: 'boolean',
    port: 'number'
}

class UploadTargetController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.typeMap = typeMap;

        this.model = UploadTarget;
        this.formClass = UploadTargetForm;
        this.formTemplate = Templates.uploadTargetForm;
        this.listTemplate = Templates.uploadTargetList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'name';
        this.defaultSortDirection = 'asc';
    }

}

module.exports.UploadTargetController = UploadTargetController;
