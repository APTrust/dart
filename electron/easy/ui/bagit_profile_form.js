const { BagItProfile } = require('../core/bagit_profile');
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
        $("[data-btn-type=NewTagDefForProfile]").on("click", this.onNewTagFileClick());

        $('.clickable-row[data-object-type="TagDefinition"]').on("click", this.onTagDefEditClick());


        // Using document.on below because these elements do not exist
        // when the view loads. They come and go as the tag editor modal
        // appears and disappears.
        $(document).on("click", "#btnTagDefinitionSave", this.onTagDefSave());
        $(document).on("click", "#btnTagDefinitionDelete", this.onTagDefDelete());
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
                Menu.bagItProfileShowForm(self.profile.id);
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
            Menu.bagItProfileShowForm(self.profile.id);
        }
    }


}

module.exports.BagItProfileForm = BagItProfileForm;
