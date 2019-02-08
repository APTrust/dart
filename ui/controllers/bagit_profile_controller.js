const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagItProfileForm } = require('../forms/bagit_profile_form');
const { BaseController } = require('./base_controller');
const { NewBagItProfileForm } = require('../forms/new_bagit_profile_form');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

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
        this.formClass = BagItProfileForm;
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
        let newProfile = this.getNewProfileFromBase();
        newProfile.save();
        this.params.set('id', newProfile.id);
        return this.edit();
    }

    // Override the base class edit method, because we have more to do here
    // than we do with most objects.
    edit() {
        let profile = BagItProfile.find(this.params.get('id'));
        let form = new BagItProfileForm(profile);
        let tagsByFile = profile.tagsGroupedByFile();
        let tagFileNames = Object.keys(tagsByFile).sort();
        let html = this.formTemplate({
            form: form,
            tagFileNames: tagFileNames,
            tagsByFile: tagsByFile
        });
        console.log(tagsByFile);
        return this.containerContent(html);
    }

    /**
     * This returns an entirely new BagItProfile, or a new BagItProfile
     * that is a copy of a base profile.
     *
     * @returns {BagItProfile}
     */
    getNewProfileFromBase() {
        let newProfile = null;
        let form = new NewBagItProfileForm();
        form.parseFromDOM();
        if(form.obj.baseProfile) {
            let baseProfile = BagItProfile.find(form.obj.baseProfile);
            newProfile = BagItProfile.inflateFrom(baseProfile);
            newProfile.id = Util.uuid4();
            newProfile.baseProfileId = baseProfile.id;
            newProfile.isBuiltIn = false;
            newProfile.name = `Copy of ${baseProfile.name}`;
            newProfile.description = `Customized version of ${baseProfile.name}`;
        } else {
            newProfile = new BagItProfile();
        }
        return newProfile;
    }

}

module.exports.BagItProfileController = BagItProfileController;
