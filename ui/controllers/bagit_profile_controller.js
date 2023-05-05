const $ = require('jquery');
const { Context } = require('../../core/context');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagItProfileForm } = require('../forms/bagit_profile_form');
const { BagItUtil } = require('../../bagit/bagit_util');
const { BaseController } = require('./base_controller');
const { NewBagItProfileForm } = require('../forms/new_bagit_profile_form');
const request = require('request');
const { TagDefinition } = require('../../bagit/tag_definition');
const { TagFileForm } = require('../forms/tag_file_form');
const Templates = require('../common/templates');
const url = require('url');
const { Util } = require('../../core/util');

const typeMap = {
    allowFetchTxt: 'boolean',
    isBuiltIn: 'boolean',
    tarDirMustMatchName: 'boolean',
    userCanDelete: 'boolean'
}

/**
 * BagItProfileController provides methods to display and update
 * {@link BagItProfile} objects.
 *
 * @param {url.URLSearchParams} params - Query parameters. The most
 * important of these is "id", which specifies the id the BagItProfile
 * to load.
 */
class BagItProfileController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        /**
         * A {@link url.URLSearchParams} object containing parameters that
         * the controller will need to render the display. For forms, the
         * only required param is usually "id", which is the UUID of the
         * object to be edited. For lists, this typically includes
         * limit, offset, orderBy, and sortDirection.
         *
         * @type {url.URLSearchParams}
         */
        this.typeMap = typeMap;
        /**
         * The model which the controller represents. In this case, it's
         * the class {@link BagItProfile}.
         *
         * @type {PersistentObject|object}
         */
        this.model = BagItProfile;
        /**
         * This is the name of the form class that can render a form for
         * this controller's model. For this controller, it's
         * {@link BagItProfileForm}
         *
         * @type {Form}
         */
        this.formClass = BagItProfileForm;
        /**
         * This is the template that renders this controller's form.
         * Templates are properties of the {@link Template} object.
         *
         * @type {handlebars.Template}
         */
        this.formTemplate = Templates.bagItProfileForm;
        /**
         * This is the template that renders this controller's object list.
         * Templates are properties of the {@link Template} object.
         *
         * @type {handlebars.Template}
         */
        this.listTemplate = Templates.bagItProfileList;
        /**
         * The name property of this template's model. This is used when
         * ordering lists of objects by name. For the {@link BagItProfile}
         * object, it's would "name".
         *
         * @type {string}
         */
        this.nameProperty = 'name';
        /**
         * The property by which this controller sorts the list display.
         * Here, it's the "name" property of the BagItProfile object.
         *
         * @type {string}
         */
        this.defaultOrderBy = 'name';
        /**
         * The default order in which to sort the list of BagItProfiles.
         * Can be "asc" or "desc". This is set to "asc".
         *
         * @type {string}
         */
        this.defaultSortDirection = 'asc';
    }

    /**
     * This method presents a form that asks if the user would like
     * to create a new BagItProfile from scratch or based on an
     * existing BagItProfile. The user has to go through this form
     * before actually getting to the BagItProfile form.
     */
    new() {
        let form = new NewBagItProfileForm();
        let html = Templates.bagItProfileNew({ form: form });
        return this.containerContent(html);
    }

    /**
     * This method creates a new BagItProfile, either from scratch
     * or based on an existing profile that the user selected. It
     * then redirects to the edit() method, so the user can customize
     * the new profile.
     */
    create() {
        let newProfile = this.getNewProfileFromBase();
        newProfile.save();
        this.params.set('id', newProfile.id);
        return this.edit();
    }

    /**
     * This presents the tabbed BagItProfile edit form that enables
     * the user to customize a BagItProfile.
     */
    edit() {
        let profile = BagItProfile.find(this.params.get('id'));
        let opts = {
            alertMessage: this.alertMessage || this.params.get('alertMessage')
        };
        this.alertMessage = null;
        return this.containerContent(this._getPageHTML(profile, opts));
    }

    /**
     * This is called when the user clicks the Save button on the
     * BagItProfile edit form. It saves the profile, if the profile
     * is valid, or re-displays the form with error message if the
     * profile is not valid.
     */
    update() {
        let profile = BagItProfile.find(this.params.get('id'));
        let form = new BagItProfileForm(profile);
        form.parseFromDOM();
        if (!form.obj.validate()) {
            let errors = this._getPageLevelErrors(form.obj);
            let opts = {
                errMessage: Context.y18n.__('Please correct the following errors.'),
                errors: errors
            }
            return this.containerContent(this._getPageHTML(form.obj, opts));
        }
        this.alertMessage = Context.y18n.__(
            "ObjectSaved_message",
            Util.camelToTitle(profile.constructor.name),
            profile.name);
        profile.save();
        return this.list();
    }

    /**
     * This fills in the page-level data structure and passes it to
     * the BagItProfileForm template. It returns the HTML rendered
     * by the template.
     *
     * @param {BagItProfile} profile - The BagItProfile whose properties
     * should be displayed in the form.
     *
     * @param {object} opts - Additional options to pass into the template
     * context. These may include errors, errMessage, and alertMessage.
     *
     * @returns {string} - The HTML to render.
     */
    _getPageHTML(profile, opts = {}) {
        let errors = this._getPageLevelErrors(profile);
        let tagsByFile = profile.tagsGroupedByFile();
        let tagFileNames = Object.keys(tagsByFile).sort();
        let data = {
            bagItProfileId: profile.id,
            form: new BagItProfileForm(profile),
            tagFileNames: tagFileNames,
            tagsByFile: tagsByFile
        }
        Object.assign(data, opts);
        return this.formTemplate(data, Templates.renderOptions);
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
     */
    _getPageLevelErrors(profile) {
        let errors = [];
        if (!Util.isEmpty(profile.errors["name"])) {
            errors.push(Context.y18n.__("About Tab: %s", profile.errors["name"]));
        }
        if (!Util.isEmpty(profile.errors["acceptBagItVersion"])) {
            errors.push(Context.y18n.__("General Tab: %s", profile.errors["acceptBagItVersion"]));
        }
        if (!Util.isEmpty(profile.errors["manifestsAllowed"])) {
            errors.push(Context.y18n.__("Manifests Tab: %s", profile.errors["manifestsAllowed"]));
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
            newProfile = new BagItProfile();
            Object.assign(newProfile, baseProfile);
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

    /**
     * This displays a modal dialog asking the user to name a new
     * tag file to be added to this profile.
     */
    newTagFile() {
        let title = Context.y18n.__("New Tag File");
        let form = new TagFileForm('custom-tags.txt');
        let body = Templates.tagFileForm({
            form: form,
            bagItProfileId: this.params.get('id')
        });
        return this.modalContent(title, body);
    }

    /**
     * This creates a new tag file in the {@link BagItProfile} by adding
     * a single new {@link TagDefinition} whose tagFile attribute
     * matches the tag file name the user typed in.
     */
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

    /**
     * This deletes a TagDefinition from this BagItProfile, if the user
     * confirms the deletion.
     */
    deleteTagDef() {
        let profile = BagItProfile.find(this.params.get('id'));
        let tagDef = profile.firstMatchingTag('id', this.params.get('tagDefId'));
        let isLastTagInFile = false;
        let tagsGroupedByFile = profile.tagsGroupedByFile();
        let message = Context.y18n.__("Delete tag %s from this profile?", tagDef.tagName);
        if (tagsGroupedByFile[tagDef.tagFile].length < 2) {
            message += ' ' + Context.y18n.__(
                "Deleting the last tag in the file will delete the tag file as well.")
            isLastTagInFile = true;
        }
        if (confirm(message)) {
            profile.tags = profile.tags.filter(t => t.id !== tagDef.id);
            profile.save();
            $(`tr[data-tag-id="${tagDef.id}"]`).remove();
            if (isLastTagInFile) {
                this.alertMessage = Context.y18n.__(
                    "Deleted tag %s and tag file %s",
                    tagDef.tagName, tagDef.tagFile);
                return this.edit(profile);
            }
        }
        return this.noContent();
    }

    /**
     * This shows a screen where user can choose to import a profile from
     * a URL or a textarea.
     *
     */
    importStart() {
        let title = Context.y18n.__("Import BagIt Profile");
        let body = Templates.bagItProfileImport();
        return this.modalContent(title, body);
    }

    /**
     * Exports a DART BagIt Profile to the format used by
     * https://github.com/bagit-profiles/bagit-profiles/
     *
     * The exported profile appears in a modal window.
     *
     */
    exportProfile() {
        let profile = BagItProfile.find(this.params.get('id'));
        let json = BagItUtil.profileToStandardJson(profile);
        let title = Context.y18n.__(profile.name);
        let body = Templates.bagItProfileExport({
            profile: profile,
            json: json
        });
        return this.modalContent(title, body);
    }

    /**
     * Attaches event handlers to elements after they are rendered
     * on the page.
     *
     * @private
     */
    postRenderCallback(fnName) {
        let controller = this;
        if (fnName == 'newTagFile' || fnName == 'newTagFileCreate') {
            $('#tagFileForm_tagFileName').keydown(this._enterKeyHandler);
        } else if (fnName == 'importStart') {
            $('#importSourceUrl').click(this._importSourceUrlClick);
            $('#importSourceTextArea').click(this._importSourceTextAreaClick);
            $('#btnImport').click(function() { controller._importProfile() });
        }
    }

    /**
     * Handler for clicks on the radio button where user specifies
     * that they want to import a BagIt profile from a URL.
     *
     * This shows the URL field and hides the textarea.
     *
     * @private
     */
    _importSourceUrlClick(e) {
        $('#txtJsonContainer').hide();
        $('#txtUrlContainer').show();
    }


    /**
     * Handler for clicks on the radio button where user specifies
     * that they want to import a BagIt profile from cut-and-paste JSON.
     *
     * This shows the textarea and hides the URL field.
     *
     * @private
     */
    _importSourceTextAreaClick(e) {
        $('#txtUrlContainer').hide();
        $('#txtJsonContainer').show();
    }

    /**
     * This calls the correct function to import a BagIt Profile, based
     * on the input source (URL or text area).
     *
     * @private
     */
    _importProfile() {
        var importSource = $("input[name='importSource']:checked").val();
        if (importSource == 'URL') {
            this._importProfileFromUrl();
        } else if (importSource == 'TextArea') {
            this._importProfileFromTextArea();
        }
    }

    /**
     * Imports a bagit-profile of Library of Congress style BagIt Profile
     * from the URL the user specified.
     *
     * @private
     */
    _importProfileFromUrl() {
        let controller = this;
        let profileUrl = $("#txtUrl").val();
        try {
            new url.URL(profileUrl);
        } catch (ex) {
            alert(Context.y18n.__("Please enter a valid URL."));
        }
        request(profileUrl, function (error, response, body) {
            if (error) {
                let msg = Context.y18n.__("Error retrieving profile from %s: %s", profileUrl, error);
                Context.logger.error(msg);
                alert(msg);
            } else if (response && response.statusCode == 200) {
                // TODO: Make sure response is JSON, not HTML.
                controller._importWithErrHandling(body, profileUrl);
            } else {
                let statusCode = (response && response.statusCode) || Context.y18n.__('Unknown');
                let msg = Context.y18n.__("Got response %s from %s", statusCode, profileUrl);
                Context.logger.error(msg);
                alert(msg);
            }
        });
    }

    /**
     * Imports a bagit-profile of Library of Congress style BagIt Profile
     * from the JSON in the textarea.
     *
     * @private
     */
    _importProfileFromTextArea() {
        let profileJson = $("#txtJson").val();
        this._importWithErrHandling(profileJson);
    }


    /**
     * This wraps the import process in a general error handler.
     *
     * @private
     */
    _importWithErrHandling(json, profileUrl) {
        try {
            this._importProfileObject(json, profileUrl);
            return true;
        } catch (ex) {
            let msg = Context.y18n.__("Error importing profile: %s", ex);
            Context.logger.error(msg);
            Context.logger.error(ex);
            alert(msg);
            return false;
        }
    }


    /**
     * This performs the actual import of the BagIt profile. It may throw
     * any number of errors, which must be handled by the caller.
     *
     * @private
     */
    _importProfileObject(json, profileUrl) {
        let obj;
        try {
            obj = JSON.parse(json);
        } catch (ex) {
            let msg = Context.y18n.__("Error parsing JSON: %s. ", ex.message || ex);
            if (profileUrl) {
                msg += Context.y18n.__("Be sure the URL returned JSON, not HTML.");
            }
            throw msg;
        }
        let convertedProfile;
        let profileType = BagItUtil.guessProfileType(obj);
        switch (profileType) {
        case 'dart':
            convertedProfile = obj;
            break;
        case 'loc_ordered':
            convertedProfile = BagItUtil.profileFromLOCOrdered(obj, profileUrl);
            break;
        case 'loc_unordered':
            convertedProfile = BagItUtil.profileFromLOC(obj, profileUrl);
            break;
        case 'bagit_profiles':
            convertedProfile = BagItUtil.profileFromStandardObject(obj);
            break;
        default:
            alert(Context.y18n.__("DART does not recognize this BagIt Profile structure."));
        }
        if (convertedProfile) {
            convertedProfile.save();
            let params = new URLSearchParams({
                id: convertedProfile.id,
                alertMessage: Context.y18n.__("Imported BagIt profile. Please review the profile to ensure it is accurate.")
            });
            return this.redirect('BagItProfile', 'edit', params);
        } else {
            let msg = Context.y18n.__("Failed to import profile");
            Context.logger.error(msg);
            alert(msg);
        }
    }

    /**
     * Handle the enter key press in the New Tag File modal. If we don't
     * handle this, the Electron browser window takes the default action
     * of submitting the single-element form, resulting in a blank window.
     *
     * This handler does what the user expects, which is the same as clicking
     * on the save button.
     *
     *
     */
    _enterKeyHandler(e) {
        if (e.keyCode == 13) {
            e.stopPropagation();
            e.preventDefault();
            if (e.type == 'keydown') {
                // trigger('click') doesn't do it...
                location.href = $('#newTagFileSave').attr('href');
            }
        }
    }
}

module.exports.BagItProfileController = BagItProfileController;
module.exports.BagItProfileControllerTypeMap = typeMap;
