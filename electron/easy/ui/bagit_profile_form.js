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


}

module.exports.BagItProfileForm = BagItProfileForm;
