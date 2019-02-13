const { Context } = require('../../core/context');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagItProfileForm } = require('../forms/bagit_profile_form');
const { BaseController } = require('./base_controller');
const { NewBagItProfileForm } = require('../forms/new_bagit_profile_form');
const { TagDefinition } = require('../../bagit/tag_definition');
const { TagDefinitionForm } = require('../forms/tag_definition_form');
const { TagFileForm } = require('../forms/tag_file_form');
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
        this.alertMessage = null;
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
            alertMessage: this.alertMessage,
            bagItProfileId: profile.id,
            form: form,
            tagFileNames: tagFileNames,
            tagsByFile: tagsByFile
        });
        this.alertMessage = null;
        return this.containerContent(html);
    }

    update() {
        let profile = BagItProfile.find(this.params.get('id'));
        let form = new BagItProfileForm(profile);
        form.parseFromDOM();
        if (!form.obj.validate()) {
            let errors = this._getPageLevelErrors(form.obj);
            let html = this.formTemplate({
                form: new BagItProfileForm(profile),
                errMessage: Context.y18n.__('Please correct the following errors.'),
                errors: errors
            });
            return this.containerContent(html);
        }
        this.alertMessage = Context.y18n.__(
            "ObjectSaved_message",
            Util.camelToTitle(profile.type),
            profile.name);
        profile.save();
        return this.list();
    }

    /**
     * This sets page-level validation errors, including information about
     * which tab contains the the error.
     *
     * @param {BagItProfile} profile
     *
     * @returns {Array<string>} Array of error messages to be displayed at the
     * top of the page.
     *
     * @private
     *
     */
    _getPageLevelErrors(profile) {
        let errors = [];
        if (!Util.isEmpty(profile.errors["name"])) {
            errors.push(Context.y18n.__("About Tab: %s", profile.errors["name"]));
        }
        if (!Util.isEmpty(profile.errors["acceptBagItVersion"])) {
            errors.push(Context.y18n.__("General Tab: %s", profile.errors["acceptBagItVersion"]));
        }
        if (!Util.isEmpty(profile.errors["manifestsRequired"])) {
            errors.push(Context.y18n.__("Manifests Tab: %s", profile.errors["manifestsRequired"]));
        }
        if (!Util.isEmpty(profile.errors["serialization"])) {
            errors.push(Context.y18n.__("Serialization Tab: %s", profile.errors["serialization"]));
        }
        if (!Util.isEmpty(profile.errors["acceptSerialization"])) {
            errors.push(Context.y18n.__("Serialization Tab: %s", profile.errors["acceptSerialization"]));
        }
        if (!Util.isEmpty(profile.errors["tags"])) {
            errors.push(Context.y18n.__("Tag Files Tab: %s", profile.errors["tags"]));
        }
        return errors;
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
            newProfile.userCanDelete = true;
            newProfile.name = `Copy of ${baseProfile.name}`;
            newProfile.description = `Customized version of ${baseProfile.name}`;
        } else {
            newProfile = new BagItProfile();
        }
        return newProfile;
    }

    newTagFile() {
        let title = Context.y18n.__("New Tag File");
        let form = new TagFileForm('custom-tags.txt');
        let body = Templates.tagFileForm({
            form: form,
            bagItProfileId: this.params.get('id')
        });
        return this.modalContent(title, body);
    }

    newTagFileCreate() {
        let title = Context.y18n.__("New Tag File");
        let form = new TagFileForm();
        form.parseFromDOM();
        if (Util.isEmpty(form.obj.tagFileName)) {
            $('#tagFileForm_tagFileNameError').text(Context.y18n.__('Tag file name is required'));
            return this.noContent();
        }
        let profile = BagItProfile.find(this.params.get('id'));
        if (profile.hasTagFile(form.obj.tagFileName)) {
            $('#tagFileForm_tagFileNameError').text(Context.y18n.__('This profile already has a tag file called %s', form.obj.tagFileName));
            return this.noContent();
        }
        profile.tags.push(new TagDefinition({
            tagName: Context.y18n.__('New-Tag'),
            tagFile: form.obj.tagFileName
        }));
        profile.save();
        this.alertMessage = Context.y18n.__("New tag file %s is available from the Tag Files menu below.", form.obj.tagFileName);
        return this.edit();
    }

}

module.exports.BagItProfileController = BagItProfileController;
