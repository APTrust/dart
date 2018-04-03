const { BagItProfile } = require('../core/bagit_profile');
const { BagItProfileList } = require('./bagit_profile_list');
const BuiltInProfiles = require('../core/builtin_profiles');
const { Choice } = require('../core/choice');
const { Field } = require('../core/field');
const { Form } = require('../core/form');
const { Menu } = require('./menu');
const State = require('../core/state');
const Templates = require('../core/templates');
const { TagDefinition } = require('../core/tag_definition');
const { Util } = require('../core/util');

class BagItProfileForm {

    constructor(profile) {
        this.profile = profile;
    }

    initEvents() {
        $("#btnBagItProfileSave").on("click", this.onSaveClick());
        $("#btnBagItProfileDelete").on("click", this.onDeleteClick());

        // Add a new tag file
        $('#btnNewTagFile').on('click', this.onNewTagFileClick());

        // Add a new tag definition
        $("[data-btn-type=NewTagDef]").on("click", this.onNewTagDefClick());

        // Edit an existing tag definition
        $('.clickable-row[data-object-type="TagDefinition"]').on("click", this.onTagDefEditClick());
    }

    onSaveClick() {
        var self = this;
        return function() {
            self.profile = BagItProfile.fromForm();
            var result = self.profile.validate();
            if (result.isValid()) {
                self.profile.save();
                return Menu.bagItProfileShowList(`Profile ${self.profile.name} saved.`);
            }
            var data = {};
            data['form'] = self.profile.toForm();
            data['form'].setErrors(result.errors);
            data['tags'] = self.profile.tagsGroupedByFile();
            data['errors'] = result.errors;
            $("#container").html(Templates.bagItProfileForm(data));
            State.ActiveObject = self.profile;
        }
    }

    onDeleteClick() {
        var self = this;
        return function() {
            if (!confirm("Delete this profile?")) {
                return;
            }
            self.profile.delete();
            State.ActiveObject = null;
            Menu.bagItProfileShowList(`Deleted profile ${self.profile.name}`);
        }
    }

    onNewTagFileClick() {
        var self = this;
        return function() {
            var tagFile = $(this).data('tag-file')
            var tag = new TagDefinition(tagFile, 'New-Tag');
            var data = {};
            data['form'] = tag.toForm();
            data['showDeleteButton'] = false;
            $('#modalTitle').text(tag.tagName);
            $("#modalContent").html(Templates.tagDefinitionForm(data));
            $('#modal').modal();
            $("#btnTagDefinitionSave").on("click", self.onTagDefSave());
            $("#btnTagDefinitionDelete").on("click", self.onTagDefDelete());
        }
    }

    onNewTagDefClick() {
        var self = this;
        return function() {
            self.profile.save();
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

    onTagDefEditClick() {
        var self = this;
        return function() {
            self.profile.save();
            var tag = self.profile.findTagById($(this).data('object-id'));
            var showDeleteButton = (tag != null && !tag.isBuiltIn);
            var data = {};
            data['form'] = tag.toForm();
            data['showDeleteButton'] = showDeleteButton;
            $('#modalTitle').text(tag.tagName);
            $("#modalContent").html(Templates.tagDefinitionForm(data));
            $('#modal').modal();
            $("#btnTagDefinitionSave").on("click", self.onTagDefSave());
            $("#btnTagDefinitionDelete").on("click", self.onTagDefDelete());
        }
    }

    // Returns a function to save a tag definition
    onTagDefSave() {
        var self = this;
        return function() {
            var tagFromForm = TagDefinition.fromForm();
            var result = tagFromForm.validate();
            if (result.isValid()) {
                var existingTag = self.profile.findTagById(tagFromForm.id);
                if (existingTag != null) {
                    existingTag = Object.assign(existingTag, tagFromForm);
                } else {
                    self.profile.requiredTags.push(tagFromForm);
                }
                self.profile.save();
                $('#modal').modal('hide');
                BagItProfileList.showForm(self.profile.id);
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
            self.profile.requiredTags = self.profile.requiredTags.filter(item => item.id != tagId);
            self.profile.save();
            $('#modal').modal('hide');
            BagItProfileList.showForm(self.profile.id);
        }
    }

    onNewTagFileClick(err) {
        var self = this;
        return function() {
            self.profile.save();
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
            var tagDef = new TagDefinition(tagFileName, "New-Tag");
            self.profile.requiredTags.push(tagDef);
            self.profile.save();
            $('#modal').modal('hide');
            BagItProfileList.showForm(self.profile.id);
        }
    }


}

module.exports.BagItProfileForm = BagItProfileForm;
