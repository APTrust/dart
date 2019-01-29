const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagItProfileForm } = require('../forms/bagit_profile_form');
const { BaseController } = require('./base_controller');
const { NewBagItProfileForm } = require('../forms/new_bagit_profile_form');
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

    // Override the new() method from the BaseController, because
    // creating a new BagItProfile includes the extra step of
    // optionally cloning an existing profile.
    new() {
        let form = new NewBagItProfileForm();
        let html = Templates.bagItProfileNew({ form: form });
        return this.containerContent(html);
    }

    // This comes after new(), creating a new blank or cloned
    // BagItProfile and then showing the user the standard edit
    // form.
    create() {
        return this.containerContent('Create new BagItProfile...');
    }


}

module.exports.BagItProfileController = BagItProfileController;
