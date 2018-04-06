const { BagItProfile } = require('../core/bagit_profile');
const { BagItProfileList } = require('./bagit_profile_list');
const BuiltInProfiles = require('../core/builtin_profiles');
const { Choice } = require('../core/choice');
const Const = require('../core/constants');
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
            self.profile = self.fromForm();
            var result = self.profile.validate();
            if (result.isValid()) {
                self.profile.save();
                return Menu.bagItProfileShowList(`Profile ${self.profile.name} saved.`);
            }
            var data = {};
            data['form'] = self.toForm();
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
                $("#btnTagDefinitionSave").on("click", self.onTagDefSave());
                $("#btnTagDefinitionDelete").on("click", self.onTagDefDelete());
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

    toForm() {
        var form = new Form('bagItProfileForm');
        form.fields['id'] = new Field('bagItProfileId', 'id', 'id', this.profile.id);
        form.fields['name'] = new Field('bagItProfileName', 'name', 'Name', this.profile.name);
        form.fields['description'] = new Field('bagItProfileDescription',
                                               'description',
                                               'Description',
                                               this.profile.description);

        form.fields['acceptBagItVersion'] = new Field('bagItProfileAcceptBagItVersion',
                                                      'acceptBagItVersion',
                                                      'BagIt Version',
                                                      this.profile.acceptBagItVersion);
        form.fields['acceptBagItVersion'].help = "Which versions of the BagIt standard are allowed for this profile?";
        form.fields['acceptBagItVersion'].choices = Choice.makeList(Const.BagItVersions, this.profile.acceptBagItVersion, false);
        form.fields['acceptBagItVersion'].attrs['multiple'] = true;

        form.fields['allowFetchTxt'] = new Field('bagItProfileAllowFetchTxt',
                                                'allowFetchTxt',
                                                'Allow Fetch File',
                                                this.profile.allowFetchTxt);
        form.fields['allowFetchTxt'].choices = Choice.makeList(Const.YesNo, this.profile.allowFetchTxt, true);
        form.fields['allowFetchTxt'].help = "Are fetch.txt files allowed? These files contain URLs of files that should be part of the bag.";
        form.fields['allowMiscTopLevelFiles'] = new Field('bagItProfileAllowMiscTopLevelFiles',
                                                'allowMiscTopLevelFiles',
                                                'Allow Miscellaneous Top-Level Files',
                                                this.profile.allowMiscTopLevelFiles);
        form.fields['allowMiscTopLevelFiles'].help = "Can the bag contain files in the top-level directory other than manifests, tag manifests, and standard tag files like bagit.txt and bag-info.txt?";
        form.fields['allowMiscTopLevelFiles'].choices = Choice.makeList(Const.YesNo, this.profile.allowMiscTopLevelFiles, true);

        form.fields['allowMiscDirectories'] = new Field('bagItProfileAllowMiscDirectories',
                                                'allowMiscDirectories',
                                                'Allow Miscellaneous Top-Level Directories',
                                                this.profile.allowMiscDirectories);
        form.fields['allowMiscDirectories'].help = "Can the bag contain directories other than 'data' in the top-level directory?";
        form.fields['allowMiscDirectories'].choices = Choice.makeList(Const.YesNo, this.profile.allowMiscDirectories, true);

        form.fields["infoIdentifier"] = new Field("bagItProfileInfoIdentifier",
                                                 "infoIdentifier",
                                                 "BagIt Profile Identifier",
                                                 this.profile.bagItProfileInfo.bagItProfileIdentifier);
        form.fields["infoIdentifier"].help = "The official URL where this BagIt profile is publicly available. Leave this blank if you're not publishing this BagIt profile.";

        form.fields["infoContactEmail"] = new Field("bagItProfileInfoContactEmail",
                                                 "infoContactEmail",
                                                 "Email Address of Profile Maintainer",
                                                 this.profile.bagItProfileInfo.contactEmail);
        form.fields["infoContactEmail"].help = "Leave this blank if you're not publishing this BagIt profile.";
        form.fields["infoContactName"] = new Field("bagItProfileInfoContactName",
                                                 "infoContactName",
                                                 "Name of Profile Maintainer",
                                                 this.profile.bagItProfileInfo.contactName);
        form.fields["infoContactName"].help = "Leave this blank if you're not publishing this BagIt profile.";
        form.fields["infoExternalDescription"] = new Field("bagItProfileInfoExternalDescription",
                                                 "infoExternalDescription",
                                                 "External Description",
                                                 this.profile.bagItProfileInfo.externalDescription);
        form.fields["infoExternalDescription"].help = "A description of this profile for people outside your organization. Leave this blank if you're not publishing this BagIt profile.";
        form.fields["infoSourceOrganization"] = new Field("bagItProfileInfoSourceOrganization",
                                                 "infoSourceOrganization",
                                                 "Source Organization",
                                                 this.profile.bagItProfileInfo.sourceOrganization);
        form.fields["infoExternalDescription"].help = "The name of the organization that maintains this profile. Leave this blank if you're not publishing this BagIt profile.";
        form.fields["infoVersion"] = new Field("bagItProfileInfoVersion",
                                                 "infoVersion",
                                                 "Version",
                                                 this.profile.bagItProfileInfo.version);
        form.fields["infoExternalDescription"].help = "The version number for this profile.";

        form.fields['manifestsRequired'] = new Field('bagItProfileManifestsRequired',
                                                     'manifestsRequired',
                                                     'Required Manifests',
                                                     this.profile.manifestsRequired);
        form.fields['manifestsRequired'].choices = Choice.makeList(Const.DigestAlgorithms, this.profile.manifestsRequired, false);
        form.fields['manifestsRequired'].help = "Which payload manifests must be present in the bag? The BagIt standard requires at least one.";
        form.fields['manifestsRequired'].attrs['multiple'] = true;

        form.fields['tagManifestsRequired'] = new Field('bagItProfileTagManifestsRequired',
                                                     'tagManifestsRequired',
                                                     'Required Tag Manifests',
                                                     this.profile.tagManifestsRequired);
        form.fields['tagManifestsRequired'].choices = Choice.makeList(Const.DigestAlgorithms, this.profile.tagManifestsRequired, false);
        form.fields['tagManifestsRequired'].help = "Which tag manifests must be present in the bag? Choose zero or more.";
        form.fields['tagManifestsRequired'].attrs['multiple'] = true;

        form.fields['serialization'] = new Field('bagItProfileSerialization',
                                                 'serialization',
                                                 'Serialization',
                                                 this.profile.serialization);
        form.fields['serialization'].choices = Choice.makeList(Const.RequirementOptions, this.profile.serialization, true);
        form.fields['serialization'].help = "Should the bag serialized into a single file?";

        // Don't allow users to edit built-in profile definitions.
        // The can add tags and edit default tag values, but that's all.
        if (this.profile.isBuiltIn) {
            var readOnly = ['acceptBagItVersion',
                            'allowFetchTxt',
                            'allowMiscTopLevelFiles',
                            'allowMiscDirectories',
                            'infoIdentifier',
                            'infoContactEmail',
                            'infoContactName',
                            'infoExternalDescription',
                            'infoSourceOrganization',
                            'infoVersion',
                            'manifestsRequired',
                            'tagManifestsRequired',
                            'serialization'];
            // Using disabled because user can still edit readonly fields in Electron.
            for(var name of readOnly) {
                form.fields[name].attrs['disabled'] = true;
            }
        }

        return form;
    }

    fromForm() {
        var id = $('#bagItProfileId').val().trim();
        var profile = BagItProfile.find(id) || new BagItProfile();
        profile.id = id;
        profile.name = $('#bagItProfileName').val().trim();
        profile.description = $('#bagItProfileDescription').val().trim();
        profile.acceptBagItVersion = Util.filterEmpties($('#bagItProfileAcceptBagItVersion').val());
        profile.allowFetchTxt = Util.boolValue($('#bagItProfileAllowFetchTxt').val().trim());
        profile.allowMiscTopLevelFiles = Util.boolValue($('#bagItProfileAllowMiscTopLevelFiles').val().trim());
        profile.allowMiscDirectories = Util.boolValue($('#bagItProfileAllowMiscDirectories').val().trim());
        profile.bagItProfileInfo.bagItProfileIdentifier = $('#bagItProfileInfoIdentifier').val().trim();
        profile.bagItProfileInfo.contactEmail = $('#bagItProfileInfoContactEmail').val().trim();
        profile.bagItProfileInfo.contectName = $('#bagItProfileInfoContactName').val().trim();
        profile.bagItProfileInfo.externalDescription = $('#bagItProfileInfoExternalDescription').val().trim();
        profile.bagItProfileInfo.sourceOrganization = $('#bagItProfileInfoSourceOrganization').val().trim();
        profile.bagItProfileInfo.version = $('#bagItProfileInfoVersion').val().trim();
        profile.manifestsRequired = Util.filterEmpties($('#bagItProfileManifestsRequired').val());
        profile.serialization = $('#bagItProfileSerialization').val().trim();
        profile.tagManifestsRequired = Util.filterEmpties($('#bagItProfileTagManifestsRequired').val());
        // Because each tag definition in profile.requiredTags is saved as it is
        // edited, we don't need to load them from the form. They should have come
        // out of the db when we called BagItProfile.find(id) above.
        return profile;
    }

}

module.exports.BagItProfileForm = BagItProfileForm;
