const { BagItProfile } = require('../../bagit/bagit_profile');
const { TagDefinition } = require('../../bagit/tag_definition');
const { TagDefinitionForm } = require('../forms/tag_definition_form');
const { BaseController } = require('./base_controller');
const Templates = require('../common/templates');

// Define a type map for any URLSearchParams we may receive.
// Params are strings by default, so we only have to define
// types that need to be converted.
const typeMap = {
    userCanDelete: 'boolean',  // part of TagDefinition
    limit: 'number',           // used in list params
    offset: 'number',          // used in list params
}

class TagDefinitionController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.typeMap = typeMap;

        this.model = TagDefinition;
        this.formClass = TagDefinitionForm;
        this.formTemplate = Templates.tagDefinitionForm;
        this.listTemplate = Templates.tagDefinitionList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'name';
        this.defaultSortDirection = 'asc';
    }

    new() {
        // Load Profile and Tag File name
        // Create new tag with default name
        // Redirect to edit
    }

    edit() {
        let profile = BagItProfile.find(this.params.get('bagItProfileId'));
        let tagDefinitionId = this.params.get('id');
        let tagDef = profile.firstMatchingTag('id', tagDefinitionId);
        let form = new TagDefinitionForm(tagDef);
        let title = `${tagDef.tagFile}: ${tagDef.tagName}`;
        let body = Templates.tagDefinitionForm({
            form: form,
            bagItProfileId: profile.id
        });
        return this.modalContent(title, body);
    }

    update() {
        let profile = BagItProfile.find(this.params.get('bagItProfileId'));
        let tagDefinitionId = this.params.get('id');
        let tagDef = profile.firstMatchingTag('id', tagDefinitionId);
        let form = new TagDefinitionForm(tagDef);
        form.parseFromDOM();

        // Special parsing for allowed values
        let allowedVals = $('#tagDefinitionForm_values').val().split('\n');
        tagDef.values = allowedVals.map(str => str.trim());

        if (!form.obj.validate()) {
            form.setErrors();
            let title = `${tagDef.tagFile}: ${tagDef.tagName}`;
            let body = Templates.tagDefinitionForm({
                form: form,
                bagItProfileId: profile.id
            });
            return this.modalContent(title, body);
        }
        // Save the underlying profile and add the new tag to
        // the underlying list in the UI.

        console.log(profile.tags);
        console.log(tagDef);

        // this.alertMessage = Context.y18n.__(
        //     "ObjectSaved_message",
        //     Util.camelToTitle(obj.type),
        //     obj[this.nameProperty]);
        // obj.save();
        // return this.list();
    }

    list() {
        // let listParams = this.paramsToHash();
        // listParams.orderBy = listParams.sortBy || this.defaultOrderBy;
        // listParams.sortDirection = listParams.sortOrder || this.defaultSortDirection;
        // let items = this.model.list(null, listParams);
        // let data = {
        //     alertMessage: this.alertMessage,
        //     items: items
        // };
        // let html = this.listTemplate(data);
        // return this.containerContent(html);
    }

    destroy() {
        // let obj = this.model.find(this.params.get('id'));
        // let confirmDeletionMessage = Context.y18n.__(
        //     "Confirm_deletion",
        //     Util.camelToTitle(obj.type),
        //     obj[this.nameProperty]);
        // if (confirm(confirmDeletionMessage)) {
        //     this.alertMessage =Context.y18n.__(
        //         "ObjectDeleted_message",
        //         Util.camelToTitle(obj.type),
        //         obj[this.nameProperty]);
        //     obj.delete();
        //     return this.list();
        // }
        // return this.noContent();
    }


}

module.exports.TagDefinitionController = TagDefinitionController;
