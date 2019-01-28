const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagItProfileForm } = require('../forms/bagit_profile_form');
const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

const typeMap = {
    allowFetchTxt: 'boolean',
    allowMiscTopLevelFiles: 'boolean',
    allowMiscDirectories: 'boolean',
    isBuiltIn: 'boolean',
    //tags: 'object',
    tarDirMustMatchName: 'boolean',
    userCanDelete: 'boolean'
}

class BagItProfileController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.typeMap = typeMap;

        this.model = BagItProfile;
        this.form = BagItProfileForm;
        this.formTemplate = Templates.bagItProfileForm;
        this.listTemplate = Templates.bagItProfileList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'name';
        this.defaultSortDirection = 'asc';
    }

}

module.exports.BagItProfileController = BagItProfileController;
