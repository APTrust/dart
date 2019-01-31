const { InternalSetting } = require('../../core/internal_setting');
const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

// Define a type map for any URLSearchParams we may receive.
// Params are strings by default, so we only have to define
// types that need to be converted.
const typeMap = {
    userCanDelete: 'boolean',  // part of InternalSetting
    limit: 'number',           // used in list params
    offset: 'number',          // used in list params
}

class InternalSettingController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.typeMap = typeMap;

        this.model = InternalSetting;
        this.form = null;
        this.formTemplate = null;
        this.listTemplate = Templates.internalSettingList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'name';
        this.defaultSortDirection = 'asc';
    }

}

module.exports.InternalSettingController = InternalSettingController;
