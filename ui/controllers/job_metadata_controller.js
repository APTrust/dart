const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const { JobTagsForm } = require('../forms/job_tags_form');
const { TagDefinition } = require('../../bagit/tag_definition');
const { TagDefinitionForm } = require('../forms/tag_definition_form');
const Templates = require('../common/templates');

class JobMetadataController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = Job.find(this.params.get('id'));
    }

    show() {
        let form = new JobTagsForm(this.job);
        let data = { job: this.job, form: form };
        return this.containerContent(Templates.jobMetadata(data));
    }

    back() {
        this._parseMetadataForm();
        this.job.save();
        return this.redirect('JobPackaging', 'show', this.params);
    }

    next() {
        let tagsAreValid = this._validateMetadataForm();
        this.job.save();
        if(!tagsAreValid) {
            return this.show();
        }
        return this.redirect('JobUpload', 'show', this.params);
    }

    newTag(form) {
        form = form || new TagDefinitionForm(new TagDefinition());
        form.fields.userValue.label = Context.y18n.__("Value");
        let title = "New Tag";
        let body = Templates.jobNewTag({
            form: form,
            job: this.job
        });
        return this.modalContent(title, body);

    }

    saveNewTag() {
        let form = new TagDefinitionForm(new TagDefinition());
        form.parseFromDOM();
        form.obj.errors = {};
        if (form.obj.tagFile == '') {
            form.obj.errors['tagFile'] = Context.y18n.__("Please specify a tag file.");
        }
        if (form.obj.tagName == '') {
            form.obj.errors['tagName'] = Context.y18n.__("Please specify a tag name.");
        }
        if (form.obj.userValue == '') {
            form.obj.errors['userValue'] = Context.y18n.__("Please specify a value for this tag.");
        }
        if (Object.keys(form.obj.errors).length > 0) {
            form.setErrors();
            return this.newTag(form);
        }
        let tagDef = form.obj;
        tagDef.isUserAddedTag = true;
        tagDef.wasAddedForJob = true;
        this.job.bagItProfile.tags.push(tagDef);
        return this.show();
    }

    _parseMetadataForm() {
        let form = new JobTagsForm(this.job);
        form.copyFormValuesToTags(this.job);
    }

    _validateMetadataForm() {
        this._parseMetadataForm();
        let isValid = true;
        for (let t of this.job.bagItProfile.tags) {
            if (!t.validateForJob()) {
                isValid = false;
            }
        }
        return isValid;
    }

    _attachTagFileAutocomplete() {
        $('#tagDefinitionForm_tagFile').autocomplete({
            source: this.job.bagItProfile.tagFileNames(),
            minLength: 1
        });
    }

    _attachToggleHiddenTags() {
        $("#btnToggleHidden").click(function() {
            let showAll = Context.y18n.__('Show All Tags');
            let hideDefaults = Context.y18n.__('Hide Default Tags');
            let currentText = $("#btnToggleHidden").text().trim();
            $('.form-group-hidden').toggle();
            if (currentText == showAll) {
                $("#btnToggleHidden").text(hideDefaults);
            } else {
                $("#btnToggleHidden").text(showAll);
            }
        });
    }

    postRenderCallback(fnName) {
        if (fnName == "newTag" || fnName == "saveNewTag") {
            this._attachTagFileAutocomplete();
        } else {
            this._attachToggleHiddenTags();
        }
    }
}

module.exports.JobMetadataController = JobMetadataController;
