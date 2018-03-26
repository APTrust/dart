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
        $("[data-btn-type=NewTagDefForJob]").click(this.showNewTagDefForm());

        // User clicks to go to the job's storage step.
        // We have to validate the required tags before moving forward.
        $("#btnJobStorage").click(this.goToJobStorage());

        // User clicks to go back to the Packaging UI
        $("#btnJobPackaging").click(this.goToJobPackaging());

        // Delete a tag definition
        $(document).on("click", "#btnTagDefinitionDeleteFromJob", this.deleteTagDef());

        // Show form for adding a new tag file.
        $(document).on("click", "#btnNewTagFileForJob", this.showNewTagFileForm(null));

        // Create the new tag file that the user just defined.
        $(document).on("click", "#btnNewTagFileCreateForJob", this.createNewTagFile());

        // Save a tag definition
        $(document).on("click", "#btnTagDefinitionSave", this.tagDefinitionSave());

        // Delete a tag definition
        $(document).on("click", "#btnTagDefinitionDelete", this.tagDefinitionDelete());

        // Delete a custom tag by clicking the little X
        $(document).on("click", "a.deleteCustomTag", this.deleteCustomTag());

        // Make sure there's always at least one pair of text fields available
        // for user to enter custom tag name / tag value pairs.
        $("body").on("keyup", ".custom-tag-value", this.autoAddCustomFields());

        // Highlight required fields.
        $('.form-control.required').each(function(index, element) {
            if ($(element).val() == "") {
                $(element).addClass("input-attention");
            } else {
                $(element).removeClass("input-attention");
            }
        });
    }

    // Tag Definition functions
    tagDefinitionShowForm(id, tagFile) {
        var tag = this.job.findTagById(id);
        var showDeleteButton = (tag != null && !tag.isBuiltIn);
        if (tag == null) {
            tag = new TagDefinition(tagFile, 'New-Tag');
            showDeleteButton = false;
        }
        var data = {};
        data['form'] = tag.toForm();
        data['showDeleteButton'] = showDeleteButton;
        data['tagContext'] = "profile";
        $('#modalTitle').text(tag.tagName);
        $("#modalContent").html(Templates.tagDefinitionForm(data));
        $('#modal').modal();
    }

    // Returns a function to save a tag definition
    tagDefinitionSave() {
        var self = this;
        return function() {
            // Copy for values to existing tag, whic is part of the
            // BagItProfile currently stored in es.State.ActiveObject.
            var tagFromForm = TagDefinition.fromForm();
            var result = tagFromForm.validate();
            if (result.isValid()) {
                self.job = Object.assign(self.job, BagItProfile.fromForm());
                var existingTag = self.job.findTagById(tagFromForm.id);
                if (existingTag == null) {
                    // This is a new tag, so add it to the profile's
                    // list of required tags.
                    existingTag = new TagDefinition('', '');
                    self.job.requiredTags.push(existingTag);
                }
                Object.assign(existingTag, tagFromForm);
                self.job.save();
                $('#modal').modal('hide');
                self.showBagItProfileForm(self.job.id);
            } else {
                var form = tagFromForm.toForm();
                form.setErrors(result.errors);
                var data = {};
                data['form'] = form;
                data['tagContext'] = "profile";
                $("#modalContent").html(Templates.tagDefinitionForm(data));
            }
        }
    }

    showBagItProfileForm() {
        var data = {};
        data['form'] = this.job.profile.toForm();
        data['tags'] = this.job.profile.tagsGroupedByFile();
        data['showDeleteButton'] = false;
        $("#container").html(Templates.bagItProfileForm(data));
    }


    tagDefinitionDelete() {
        var self = this;
        return function() {
            if (!confirm("Delete this tag?")) {
                return;
            }
            var tagId = TagDefinition.fromForm().id;
            self.job.requiredTags = self.job.requiredTags.filter(item => item.id != tagId);
            self.job.save();
            $('#modal').modal('hide');
            self.showBagItProfileForm();
        }
    }

    // newTagFileShowForm(err) {
    //     var form = new Form();
    //     form.fields['newTagFileName'] = new Field("newTagFileName", "newTagFileName", "New Tag File Name", "");
    //     if (err != null) {
    //         var errs = {};
    //         errs['newTagFileName'] = err;
    //         form.setErrors(errs);
    //     }
    //     var data = {};
    //     data['form'] = form;
    //     data['tagContext'] = "profile";
    //     $('#modalTitle').text("New Tag File");
    //     $("#modalContent").html(Templates.newTagFileForm(data));
    //     $('#modal').modal();
    // }

    // newTagFileCreate() {
    //     var tagFileName = $('#newTagFileName').val().trim();
    //     var re = /^[A-Za-z0-9_\-\.]+\.txt$/;
    //     if (!tagFileName.match(re)) {
    //         err = "Tag file name must contain at least one character and end with .txt";
    //         return this.newTagFileShowForm(err)();
    //     }
    //     this.tagDefinitionShowForm(null, tagFileName);
    // }

    // -------------------

    // Returns the function to be executed when user clicks New Tag Definition.
    showNewTagDefForm() {
        var self = this;
        return function() {
            var tagFile = $(this).data('tag-file');
            var tag = new TagDefinition(tagFile, 'New-Tag');
            var data = {};
            data['form'] = tag.toForm();
            data['showDeleteButton'] = false;
            data['tagContext'] = "job";
            $('#modalTitle').text(tag.tagName);
            $("#modalContent").html(Templates.tagDefinitionForm(data));
            $('#modal').modal();
        }
    }

    // Returns a function to delete a tag definition.
    deleteTagDef() {
        var self = this;
        return function() {
            if (!confirm("Delete this tag?")) {
                return;
            }
            var tagId = TagDefinition.fromForm().id;
            self.job.bagItProfile.requiredTags = self.job.requiredTags.filter(item => item.id != tagId);
            self.job.save();
            $('#modal').modal('hide');
            self.showJobTagForm();
        }
    }

    showJobTagForm() {
        var data = this.job.dataForTagEditor();
        data['tagContext'] = "job";
        $("#container").html(Templates.jobTags(data));
    }

    // This returns the callback for #btnNewTagFileForJob
    showNewTagFileForm(err) {
        var self = this;
        return function(err) {
            // Save now, even if some tags are missing or invalid,
            // because we'll need to properly restore the underlying
            // form when we close this modal.
            self.job.save();
            var form = new Form();
            form.fields['newTagFileName'] = new es.Field("newTagFileName", "newTagFileName", "New Tag File Name", "");
            if (err != null) {
                var errs = {};
                errs['newTagFileName'] = err;
                form.setErrors(errs);
            }
            var data = {};
            data['form'] = form;
            data['tagContext'] = "job";
            $('#modalTitle').text("New Tag File");
            $("#modalContent").html(Templates.newTagFileForm(data));
            $('#modal').modal();
            $('#modal').on('shown.bs.modal', function() {
                $('#newTagFileName').focus();
            })
        }
    }

    // The returns the callback for #btnNewTagFileCreateForJob
    createNewTagFile() {
        var self = this;
        return function() {
            var tagFileName = $('#newTagFileName').val().trim();
            var re = /^[A-Za-z0-9_\-\.\/]+\.txt$/;
            if (!tagFileName.match(re)) {
                err = "Tag file name must contain at least one character and end with .txt";
                var showItAgainWithErrors = self.showNewTagFileForm(err);
                return showItAgainWithErrors();
            }
            var tagDef = new TagDefinition(tagFileName, "");
            tagDef.addedForJob = true;
            self.job.bagItProfile.requiredTags.push(tagDef);
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
    autoAddCustomFields(event) {
        var self = this;
        return function(event) {
            var parentElement = $(event.target).closest('.panel-body')[0];
            if(!self.hasEmptyCustomFields(parentElement)) {
                var tagId = $(event.target).data('tag-id');
                var tagDef = self.job.bagItProfile.findTagById(tagId);
                self.addEmptyCustomField(parentElement, tagDef.tagFile);
            }
        }
    }

    // Are we still using this?
    deleteCustomTag(tagId) {
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
    goToJobStorage() {
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
            self.job.setTagValuesFromForm();
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
    goToJobPackaging() {
        var self = this;
        return function() {
            self.job.setTagValuesFromForm();
            self.job.save();
            var data = {};
            data.form = job.toPackagingForm();
            data.domainName = AppSetting.findByName("Institution Domain").value;
            data.showProfileList = data.form.fields.packageFormat.getSelected() == "BagIt";
            $("#container").html(Templates.jobPackaging(data));
        }
    }
}


module.exports.JobTags = JobTags;
