const { BagItProfile } = require('../../bagit/bagit_profile');
const { Context } = require('../../core/context');
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
        let profile = BagItProfile.find(this.params.get('bagItProfileId'));
        let tagDef = new TagDefinition({
            tagFile: this.params.get('tagFileName'),
            tagName: Context.y18n.__('New-Tag'),
            isBuiltIn: false,
            isUserAddedTag: true,
        });
        profile.tags.push(tagDef);
        profile.save();
        this.params.set('id', tagDef.id);
        return this.edit();
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

        // Special parsing for allowed values. Do not create the values
        // list if this field is empty, or you'll wind up with this:
        // [""], which will cause other parts of the UI to render
        // HTML select fields with no viable choices when they should
        // render HTML text inputs instead.
        let allowedVal = $('#tagDefinitionForm_values').val();
        if (allowedVal != null && allowedVal.trim() != "") {
            let allowedVals = $('#tagDefinitionForm_values').val().split('\n');
            tagDef.values = allowedVals.map(str => str.trim());
        } else {
            tagDef.values = [];
        }

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
        profile.save();
        this._updateTagList(profile, tagDef);
        $('#modal').modal('hide');
        return this.noContent();
    }

    _updateTagList(profile, tagDef) {
        let tagsByFile = profile.tagsGroupedByFile();
        let html = Templates.partials['profileTags']({
            tags: tagsByFile[tagDef.tagFile],
            bagItProfileId: profile.id,
            tagFileName: tagDef.tagFile
        });
        $(`div[data-tag-file-name='${tagDef.tagFile}']`).html(html);
    }
}

module.exports.TagDefinitionController = TagDefinitionController;
