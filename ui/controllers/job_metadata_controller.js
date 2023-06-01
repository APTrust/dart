const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const { JobTagsForm } = require('../forms/job_tags_form');
const { TagDefinition } = require('../../bagit/tag_definition');
const { TagDefinitionForm } = require('../forms/tag_definition_form');
const Templates = require('../common/templates');


/**
 * The JobMetadataController presents the page that allows users
 * to define a bag's tag metadata. This page appears only for
 * Jobs that require bagging and include a {@link BagItProfile}.
 *
 * @param {URLSearchParams} params - The URL search params parsed
 * from the URL used to reach this page. This should contain at
 * least the Job Id.
 *
 * @param {string} params.id - The id of the Job being worked
 * on. Job.id is a UUID string.
 */
class JobMetadataController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = Job.find(this.params.get('id'));
    }

    /**
     * This displays a form in which a user can edit the
     * tags and tag values for the BagIt bag that this Job
     * will produce.
     */
    show() {
        let form = new JobTagsForm(this.job);
        let data = { job: this.job, form: form };
        return this.containerContent(Templates.jobMetadata(data));
    }

    /**
     * This handles the page's Back button click, saving changes
     * to tag values without validating them, and sending the user
     * back to the packaging page.
     */
    back() {
        this._parseMetadataForm();
        this.job.save();
        return this.redirect('JobPackaging', 'show', this.params);
    }

    /**
     * This handles the click on the Next button, saving changes
     * to the tag values and validating those changes. If the
     * data is valid, the user moves on to the upload page.
     */
    next() {
        let tagsAreValid = this._validateMetadataForm();
        this.job.save();
        if(!tagsAreValid) {
            return this.show();
        }
        let nextController = 'JobUpload';
        // If we have a workflow id, the uploads for this job
        // are already determined, so we can skip that screen.
        if (this.job.workflowId) {
            nextController = 'JobRun';
        }
        return this.redirect(nextController, 'show', this.params);
    }

    /**
     * This presents a modal dialog in which a user can define a new
     * tag. Tags created through this dialog apply only to the current
     * job.
     */
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

    /**
     * This saves the new tag that the user created in the modal
     * dialog.
     */
    saveNewTag() {
        
        // Save the existing form data before we try to
        // add the new tag, because user may have unsaved
        // changes here. Fixes https://trello.com/c/lOronZpj
        this._parseMetadataForm();
        this.job.save();

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
        this.job.save();
        return this.show();
    }

    /**
     * This parses user input from the tags form and copies the
     * values into the Job's local copy of the BagItProfile.
     */
    _parseMetadataForm() {
        let form = new JobTagsForm(this.job);
        form.copyFormValuesToTags(this.job);
    }

    /**
     * This calls {@link _parseMetadataForm} to parse user-entered
     * data and copy it into the Job. It also validates the data in
     * each tag field.
     */
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

    /**
     * This attaches a jQuery autocomplete handler to the
     * tag file name input in the modal dialog where users
     * can create new job-level tags.
     */
    _attachTagFileAutocomplete() {
        $('#tagDefinitionForm_tagFile').autocomplete({
            source: this.job.bagItProfile.tagFileNames(),
            minLength: 1
        });
    }

    /**
     * This attaches an event to the button that allows users
     * to show and hide form fields for tags that have
     * been pre-populated with default values. The UI hides these
     * by default so they don't overwhelm the user.
     */
    _attachToggleHiddenTags() {
        $("#btnToggleHidden").click(function() {
            let showAll = Context.y18n.__('Show All Tags');
            let hideDefaults = Context.y18n.__('Hide Default Tags');
            let currentText = $("#btnToggleHidden").text().trim();
            $('.form-group-hidden').toggle();
            if (currentText == showAll) {
                $("#btnToggleHidden").text(hideDefaults);
                $('.what-is-showing i').text(
                    Context.y18n.__('Showing all tags.')
                );
            } else {
                $("#btnToggleHidden").text(showAll);
                $('.what-is-showing i').text(
                    Context.y18n.__('Tags with default values are not showing.')
                );
            }
        });
    }

    /**
     * This calls functions to attach event handlers to elements
     * that have just been rendered on the page.
     */
    postRenderCallback(fnName) {
        if (fnName == "newTag" || fnName == "saveNewTag") {
            this._attachTagFileAutocomplete();
        } else {
            this._attachToggleHiddenTags();
        }
    }
}

module.exports.JobMetadataController = JobMetadataController;
