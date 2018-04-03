const fs = require('fs');
const { AppSetting } = require('../core/app_setting');
const { BagItProfile } = require('../core/bagit_profile');
const { Field } = require('../core/field');
const { Form } = require('../core/form');
const { Job } = require('../core/job');
const path = require('path');
const { TagDefinition } = require('../core/tag_definition');
const Templates = require('../core/templates');
const { Util } = require('../core/util');

// UI manager for the job_tags.html template,
// where user defines tags and tag values.
class JobTags {

    constructor(job) {
        this.job = job;
    }

    initEvents() {

        // User clicks to add a new tag definition for this job.
        $("[data-btn-type=NewTagDefForJob]").click(this.onNewTagDefClick());

        // User clicks to go to the job's storage step.
        // We have to validate the required tags before moving forward.
        $("#btnJobStorage").click(this.onJobStorageClick());

        // User clicks to go back to the Packaging UI
        $("#btnJobPackaging").click(this.onJobPackagingClick());

        // Show form for adding a new tag file.
        $("#btnNewTagFile").on("click", this.onNewTagFileClick(null));

        // Create the new tag file that the user just defined.
        // $(document).on("click", "#btnTagFileCreate", this.onTagFileCreateClick());

        // Save a tag definition
        // $(document).on("click", "#btnTagDefinitionSave", this.onTagDefSave());
        // Delete a tag definition
        // $(document).on("click", "#btnTagDefinitionDelete", this.onTagDefDelete());

        // Delete a custom tag by clicking the little X
        $(document).on("click", "a.deleteCustomTag", this.onDeleteCustomTag());

        // Make sure there's always at least one pair of text fields available
        // for user to enter custom tag name / tag value pairs.
        $("body").on("keyup", ".custom-tag-value", this.onCustomTagKeyUp());

        // Highlight required fields.
        $('.form-control.required').each(function(index, element) {
            if ($(element).val() == "") {
                $(element).addClass("input-attention");
            } else {
                $(element).removeClass("input-attention");
            }
        });
    }

    // // Tag Definition form
    // tagDefinitionShowForm(id, tagFile) {
    //     this.setTagValuesFromForm();
    //     this.job.save();
    //     var tag = this.job.findTagById(id);
    //     var showDeleteButton = (tag != null && !tag.isBuiltIn);
    //     if (tag == null) {
    //         tag = new TagDefinition(tagFile, 'New-Tag');
    //         showDeleteButton = false;
    //     }
    //     var data = {};
    //     data['form'] = tag.toForm();
    //     data['showDeleteButton'] = showDeleteButton;
    //     $('#modalTitle').text(tag.tagName);
    //     $("#modalContent").html(Templates.tagDefinitionForm(data));
    //     $('#modal').modal();
    //     $("#btnTagDefinitionSave").on("click", this.onTagDefSave());
    //     $("#btnTagDefinitionDelete").on("click", this.onTagDefDelete());
    // }

    // Returns a function to save a tag definition
    onTagDefSave() {
        var self = this;
        return function() {
            var tagFromForm = TagDefinition.fromForm();
            var result = tagFromForm.validate();
            if (result.isValid()) {
                var existingTag = self.job.bagItProfile.findTagById(tagFromForm.id);
                if (existingTag != null) {
                    existingTag = Object.assign(existingTag, tagFromForm);
                } else {
                    self.job.bagItProfile.requiredTags.push(tagFromForm);
                }
                self.setTagValuesFromForm();
                self.job.save();
                $('#modal').modal('hide');
                $("#container").html(Templates.jobTags(self.job.dataForTagEditor()));
            } else {
                var form = tagFromForm.toForm();
                form.setErrors(result.errors);
                var data = {};
                data['form'] = form;
                data['tagContext'] = "job";
                $("#modalContent").html(Templates.tagDefinitionForm(data));
            }
        }
    }

    onTagDefDelete() {
        var self = this;
        return function() {
            if (!confirm("Delete this tag?")) {
                return;
            }
            var tagId = TagDefinition.fromForm().id;
            self.job.requiredTags = self.job.requiredTags.filter(item => item.id != tagId);
            self.setTagValuesFromForm();
            self.job.save();
            $('#modal').modal('hide');
            $("#container").html(Templates.jobTags(self.job.dataForTagEditor()));

        }
    }

    // Returns the function to be executed when user clicks New Tag Definition.
    onNewTagDefClick() {
        var self = this;
        return function() {
            self.setTagValuesFromForm();
            self.job.save();
            var tagFile = $(this).data('tag-file');
            var tag = new TagDefinition(tagFile, 'New-Tag');
            var data = {};
            data['form'] = tag.toForm();
            data['showDeleteButton'] = false;
            data['tagContext'] = "job";
            $('#modalTitle').text(tag.tagName);
            $("#modalContent").html(Templates.tagDefinitionForm(data));
            $("#btnTagDefinitionSave").on("click", self.onTagDefSave());
            $("#btnTagDefinitionDelete").on("click", self.onTagDefDelete());
            $('#modal').modal();
        }
    }

    showJobTagForm() {
        var data = this.job.dataForTagEditor();
        data['tagContext'] = "job";
        $("#container").html(Templates.jobTags(data));
    }

    // This returns the callback for #btnNewTagFile
    onNewTagFileClick(err) {
        var self = this;
        return function() {
            // Save now, even if some tags are missing or invalid,
            // because we'll need to properly restore the underlying
            // form when we close this modal.
            self.setTagValuesFromForm();
            self.job.save();
            self.showNewFileForm(null, null);
        }
    }

    showNewFileForm(filename, err) {
        var form = new Form();
        form.fields['newTagFileName'] = new es.Field("newTagFileName", "newTagFileName",
                                                     "New Tag File Name", filename);
        form.fields['newTagFileName'].error = err;
        var data = {};
        data['form'] = form;
        data['tagContext'] = "job";
        $('#modalTitle').text("New Tag File");
        $("#modalContent").html(Templates.newTagFileForm(data));
        $('#modal').modal();
        $('#btnTagFileCreate').on('click', this.onTagFileCreateClick());
        $('#modal').on('shown.bs.modal', function() {
            $('#newTagFileName').focus();
        })
    }

    // The returns the callback for #btnTagFileCreate
    onTagFileCreateClick() {
        var self = this;
        return function(event) {
            var tagFileName = $('#newTagFileName').val().trim();
            var re = /^[A-Za-z0-9_\-\.\/]+\.txt$/;
            if (!tagFileName.match(re)) {
                var err = "Tag file name must contain at least one character and end with .txt";
                return self.showNewFileForm(tagFileName, err);
            }
            if (tagFileName.startsWith('data/')) {
                var err = "Tag file name cannot start with 'data/' because that would make it a payload file.";
                return self.showNewFileForm(tagFileName, err);
            }
            var tagDef = new TagDefinition(tagFileName, "");
            tagDef.addedForJob = true;
            self.job.bagItProfile.requiredTags.push(tagDef);
            self.setTagValuesFromForm();
            self.job.save();
            $('#modal').modal('hide');
            self.showJobTagForm();
        }
    }

    hasEmptyCustomFields(parentElement) {
        var fields = $(parentElement).find(".custom-tag");
        for(var i=0; i < fields.length; i += 2) {
            var name = $(fields[i]).val();
            var value = $(fields[i]).val();
            if (Util.isEmpty(name) && Util.isEmpty(value)) {
                return true;
            }
        }
        return false;
    }

    addEmptyCustomField(parentElement, tagFileName) {
        var tagDef = new es.TagDefinition(tagFileName, "");
        tagDef.addedForJob = true;
        this.job.bagItProfile.requiredTags.push(tagDef);
        var data = {};
        data.field = tagDef.toFieldForJobForm();
        // hack!
        var handlebars = require('handlebars')
        var customTagTemplate = handlebars.partials['customTag'];
        $(parentElement).append(customTagTemplate(data));
    }

    // This returns a function for adding new custom fields to a tag
    // file. As the user enters custom name-value pairs for a custom
    // tag file, we want to be sure at least one new pair of text entry
    // fields are available for the user to enter the next name-value
    // pair.
    onCustomTagKeyUp(event) {
        var self = this;
        return function(event) {
            var parentElement = $(event.target).closest('.panel-body')[0];
            var tagFile = $(parentElement).data('file-name');
            if(!self.hasEmptyCustomFields(parentElement)) {
                var tagId = $(event.target).data('tag-id');
                if (!tagFile) {
                    var tagDef = self.job.bagItProfile.findTagById(tagId);
                    tagFile = tagDef.tagFile;
                }
                self.addEmptyCustomField(parentElement, tagFile);
            }
        }
    }

    // Are we still using this?
    onDeleteCustomTag(tagId) {
        var self = this;
        return function() {
            var tagId = $(this).data('tag-id');
            var tags = self.job.bagItProfile.requiredTags;
            var index = -1;
            for(var i=0; i < tags.length; i++) {
                if (tags[i].id == tagId) {
                    index = i;
                    break;
                }
            }
            if (index > -1) {
                self.job.bagItProfile.requiredTags.splice(index, 1);
                $(`div [data-custom-tag-id="${tagId}"]`).remove();
            }
        }
    }

    // This returns a callback function for #btnJobStorage. The function
    // validates required tags before letting the user move on to
    // the job's storage step.
    onJobStorageClick() {
        var self = this;
        return function() {
            var isValid = true;
            for (var f of $(".form-control.required")) {
                var field = $(f);
                var parent = field.closest("div.form-group");
                if (field.val() == "") {
                    isValid = false;
                    parent.removeClass("has-success");
                    parent.addClass("has-error");
                } else {
                    parent.removeClass("has-error");
                    parent.addClass("has-success");
                }
            }
            self.setTagValuesFromForm();
            self.job.save();
            if (isValid) {
                // OK - go to the storage UI
                $("#jobTagsMissing").hide();
                var data = {};
                data.bagOrFiles = "bag";
                if (self.job.bagItProfile == null) {
                    data.bagOrFiles = "files";
                }
                data.form = self.job.toStorageServiceForm();
                $("#container").html(Templates.jobStorage(data));
            } else {
                // Invalid - Fix missing required tags.
                $("#jobTagsMissing").show();
                console.log("Form is not valid.");
            }
        }
    }

    // This returns a callback function for #btnJobPackaging.
    // We save the user's edits to the job definition before going
    // back to the Packaging UI.
    onJobPackagingClick() {
        var self = this;
        return function() {
            self.setTagValuesFromForm();
            self.job.save();
            var data = {};
            data.jobId = self.job.id;
            data.form = self.job.toPackagingForm();
            data.domainName = AppSetting.findByName("Institution Domain").value;
            data.showProfileList = data.form.fields.packageFormat.getSelected() == "BagIt";
            $("#container").html(Templates.jobPackaging(data));
        }
    }

    setTagValuesFromForm() {
        if (this.job.bagItProfile == null) {
            return;
        }
        // Regular tags from the job's bagit profile.
        for (var input of $("#jobTagsForm .form-control")) {
            var id = $(input).attr('id');
            var tag = this.job.bagItProfile.findTagById(id);
            if (tag != null) {
                tag.userValue = $(input).val();
            }
        }
        // Custom job-specific tags added by the user.
        for (var input of $("#jobTagsForm .custom-tag-name")) {
            var name = $(input).val();
            var id = $(input).data('tag-id');
            var value = $(`#${id}-value`).val();
            var tag = this.job.bagItProfile.findTagById(id);
            if (tag != null) {
                tag.tagName = name;
                tag.userValue = value;
            }
        }
        // Special for APTrust: Copy APTrust description into Internal-Sender-Description
        // if necessary. APTrust ingest code changed in 2.0 to read from the latter field.
        var aptDescTag = this.job.bagItProfile.findTagByName('Description');
        var bagItDescTag = this.job.bagItProfile.findTagByName('Internal-Sender-Description');
        if (aptDescTag && !Util.isEmpty(aptDescTag.userValue)) {
            if (bagItDescTag) {
                bagItDescTag.userValue = aptDescTag.userValue;
            }
        }
    }

}


module.exports.JobTags = JobTags;
