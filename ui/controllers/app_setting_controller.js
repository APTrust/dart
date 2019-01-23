const { AppSetting } = require('../../core/app_setting');
const { AppSettingForm } = require('../forms/app_setting_form');
const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

// Define a type map for any URLSearchParams we may receive.
// Params are strings by default, so we only have to define
// types that need to be converted.
const typeMap = {
    userCanDelete: 'boolean',  // part of AppSetting
    limit: 'number',           // used in list params
    offset: 'number',          // used in list params
}

class AppSettingController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.typeMap = typeMap;

        this.model = AppSetting;
        this.form = AppSettingForm;
        this.formTemplate = Templates.appSettingForm;
        this.listTemplate = Templates.appSettingList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'name';
        this.defaultSortDirection = 'asc';
    }

}

module.exports.AppSettingController = AppSettingController;
