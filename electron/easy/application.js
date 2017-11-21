$(function() {
    const path = require("path");
    const es = require(path.resolve('electron/easy/easy_store'));
    const templates = require(path.resolve('electron/easy/templates'));
    const builtins = require(path.resolve('electron/easy/builtin_profiles'));

    // Top nav menu
    $("#menuAppSettingList").on('click', function() { appSettingShowList(null); });
    $("#menuBagItProfileList").click(function() { bagItProfileShowList(null); });
    $("#menuStorageServiceList").click(function() { storageServiceShowList(null); });

    // AppSetting Form
    $(document).on("click", "#btnNewAppSetting", function() { appSettingShowForm(null); });
    $(document).on("click", "#btnApplicationSettingSave", appSettingSave);
    $(document).on("click", "#btnApplicationSettingDelete", appSettingDelete);

    // BagItProfile Form
    $(document).on("click", "#btnNewBagItProfile", function() { bagItProfileChooseNew(); });
    $(document).on("click", "#btnBagItProfileSave", bagItProfileSave);
    $(document).on("click", "#btnBagItProfileDelete", bagItProfileDelete);
    $(document).on("click", "#btnNewBagItProfileCreate", bagItProfilePrepare);

    // StorageService Form
    $(document).on("click", "#btnNewStorageService", function() { storageServiceShowForm(null); });
    $(document).on("click", "#btnStorageServiceSave", storageServiceSave);
    $(document).on("click", "#btnStorageServiceDelete", storageServiceDelete);

    // TagDefinition Form
    $(document).on("click", "[data-btn-type=NewTagDef]", function() {
        tagDefinitionShowForm(null, $(this).data('tag-file'));
    });
    $(document).on("click", "#btnTagDefinitionSave", tagDefinitionSave);
    $(document).on("click", "#btnTagDefinitionDelete", tagDefinitionDelete);
    $(document).on("click", "#btnNewTagFile", function() { newTagFileShowForm(null); });
    $(document).on("click", "#btnNewTagFileCreate", newTagFileCreate);

    // Clickable table rows for editing objects
    $(document).on("click", ".clickable-row", function() {
		var id = $(this).data("object-id");
        var type = $(this).data("object-type");
        switch (type) {
         case 'AppSetting':
            appSettingShowForm(id);
            break;
         case 'BagItProfile':
            bagItProfileShowForm(id);
            break;
         case 'StorageService':
            storageServiceShowForm(id);
            break;
         case 'TagDefinition':
            tagDefinitionShowForm(id, null);
            break;
         default:
            alert(`Type ${type}? WTF?`);
        }
	});

    // App Setting functions
    function appSettingShowList(message) {
        var data = {};
        data.items = es.Util.sortByName(es.DB.appSettings.store);
        data.success = message;
        $("#container").html(templates.appSettingList(data));
        es.ActiveObject = data.items;
    }

    function appSettingShowForm(id) {
        var setting = new es.AppSetting();
        var showDeleteButton = false;
        if (!es.Util.isEmpty(id)) {
            setting = es.AppSetting.find(id);
            showDeleteButton = true;
        }
        var data = {};
        data['form'] = setting.toForm();
        data['showDeleteButton'] = showDeleteButton;
        $("#container").html(templates.appSettingForm(data));
        es.ActiveObject = setting;
    }

    function appSettingSave() {
        var setting = es.AppSetting.fromForm();
        var result = setting.validate();
        if (result.isValid()) {
            setting.save();
            return appSettingShowList(`Setting ${setting.name} has been saved`);
        } else {
            var form = setting.toForm();
            form.setErrors(result.errors);
            var data = {};
            data['form'] = form;
            data['showDeleteButton'] = es.AppSetting.find(setting.id) != null;
            $("#container").html(templates.appSettingForm(data));
        }
        es.ActiveObject = setting;
    }

    function appSettingDelete() {
        if (!confirm("Delete this setting?")) {
            return;
        }
        var setting = es.ActiveObject.delete();
        appSettingShowList(`Deleted setting ${setting.name}`);
    }

    // BagItProfile functions
    function bagItProfileShowList(message) {
        var data = {};
        data.items = es.Util.sortByName(es.DB.bagItProfiles.store)
        data.success = message;
        $("#container").html(templates.bagItProfileList(data));
        es.ActiveObject = data.items;
    }

    function bagItProfileChooseNew() {
        var form = new es.Form();
        form.fields['baseProfile'] = new es.Field("baseProfile", "baseProfile", "New Profile", "");
        form.fields['baseProfile'].choices = [
            new es.Choice("", "Blank", true),
        ];
        form.fields['baseProfile'].help = "Do you want to create a blank new profile from scratch, or a new profile that conforms to an existing standard?";
        var sortedKeys = Object.keys(builtins.ProfilesAvailable).sort();
        for(var name of sortedKeys) {
            var profileId = builtins.ProfilesAvailable[name];
            form.fields['baseProfile'].choices.push(new es.Choice(profileId, name, false));
        }
        var data = {};
        data.form = form;
        $('#modalTitle').text("Create New BagIt Profile");
        $("#modalContent").html(templates.bagItProfileNew(data));
        $('#modal').modal();
    }

    function bagItProfilePrepare() {
        var profileId = null;
        var builtinId = $('#baseProfile').val().trim();
        if (!es.Util.isEmpty(builtinId)) {
            var profile = createProfileFromBuiltin(baseProfileId);
            profileId = profile.Id;
        }
        $('#modal').modal('hide');
        bagItProfileShowForm(profileId);
    }

    function bagItProfileShowForm(id) {
        var profile = new es.BagItProfile();
        var showDeleteButton = false;
        if (!es.Util.isEmpty(id)) {
            profile = es.BagItProfile.find(id);
            showDeleteButton = true;
        }
        var data = {};
        data['form'] = profile.toForm();
        data['tags'] = profile.tagsGroupedByFile();
        data['showDeleteButton'] = showDeleteButton;
        $("#container").html(templates.bagItProfileForm(data));
        es.ActiveObject = profile;
    }

    function bagItProfileSave() {
        var profile = es.BagItProfile.fromForm();
        var result = profile.validate();
        if (result.isValid()) {
            profile.save();
            return bagItProfileShowList(`Profile ${profile.name} saved.`);
        }
        var data = {};
        data['form'] = profile.toForm();
        data['form'].setErrors(result.errors);
        data['tags'] = profile.tagsGroupedByFile();
        $("#container").html(templates.bagItProfileForm(data));
        es.ActiveObject = profile;
    }

    function bagItProfileDelete() {
        if (!confirm("Delete this profile?")) {
            return;
        }
        var profile = es.ActiveObject.delete();
        bagItProfileShowList(`Deleted profile ${profile.name}`);
    }

    // StorageService functions
    function storageServiceShowList(message) {
        var data = {};
        data.items = es.Util.sortByName(es.DB.storageServices.store)
        data.success = message;
        $("#container").html(templates.storageServiceList(data));
        es.ActiveObject = data.items;
    }

    function storageServiceShowForm(id) {
        var service = new es.StorageService();
        var showDeleteButton = false;
        if (!es.Util.isEmpty(id)) {
            service = es.StorageService.find(id);
            showDeleteButton = true;
        }
        var data = {};
        data['form'] = service.toForm();
        data['showDeleteButton'] = showDeleteButton;
        $("#container").html(templates.storageServiceForm(data));
        es.ActiveObject = service;
    }

    function storageServiceSave() {
        var service = es.StorageService.fromForm();
        var result = service.validate();
        if (result.isValid()) {
            service.save();
            return storageServiceShowList(`Storage service ${service.name} has been saved`);
        } else {
            var form = service.toForm();
            form.setErrors(result.errors);
            var data = {};
            data['form'] = form;
            data['showDeleteButton'] = es.StorageService.find(service.id) != null;
            $("#container").html(templates.storageServiceForm(data));
        }
        es.ActiveObject = service;
    }

    function storageServiceDelete() {
        if (!confirm("Delete this storage service?")) {
            return;
        }
        var service = es.ActiveObject.delete();
        storageServiceShowList(`Deleted storage service ${service.name}`);
    }


    // Tag Definition functions
    function tagDefinitionShowForm(id, tagFile) {
        var tag = es.ActiveObject.findTagById(id);
        var showDeleteButton = (tag != null && !tag.isBuiltIn);
        if (tag == null) {
            tag = new es.TagDefinition(tagFile, 'New-Tag');
            showDeleteButton = false;
        }
        var data = {};
        data['form'] = tag.toForm();
        data['showDeleteButton'] = showDeleteButton;
        $('#modalTitle').text(tag.tagName);
        $("#modalContent").html(templates.tagDefinitionForm(data));
        $('#modal').modal();
    }

    function tagDefinitionSave() {
        // Copy for values to existing tag, whic is part of the
        // BagItProfile currently stored in es.ActiveObject.
        var tagFromForm = es.TagDefinition.fromForm();
        var result = tagFromForm.validate();
        if (result.isValid()) {
            es.ActiveObject = Object.assign(es.ActiveObject, es.BagItProfile.fromForm());
            var existingTag = es.ActiveObject.findTagById(tagFromForm.id);
            if (existingTag == null) {
                // This is a new tag, so add it to the profile's
                // list of required tags.
                existingTag = new es.TagDefinition('', '');
                es.ActiveObject.requiredTags.push(existingTag);
            }
            Object.assign(existingTag, tagFromForm);
            es.ActiveObject.save();
            $('#modal').modal('hide');
            bagItProfileShowForm(es.ActiveObject.id);
        } else {
            var form = tagFromForm.toForm();
            form.setErrors(result.errors);
            $("#modalContent").html(templates.tagDefinitionForm(form));
        }
    }

    function tagDefinitionDelete() {
        if (!confirm("Delete this tag?")) {
            return;
        }
        var tagId = es.TagDefinition.fromForm().id;
        console.log(tagId);
        es.ActiveObject.requiredTags = es.ActiveObject.requiredTags.filter(item => item.id != tagId);
        es.ActiveObject.save();
        $('#modal').modal('hide');
        bagItProfileShowForm(es.ActiveObject.id);
    }

    function newTagFileShowForm(err) {
        var form = new es.Form();
        form.fields['newTagFileName'] = new es.Field("newTagFileName", "newTagFileName", "New Tag File Name", "");
        if (err != null) {
            var errs = {};
            errs['newTagFileName'] = err;
            form.setErrors(errs);
        }
        var data = {};
        data['form'] = form;
        $('#modalTitle').text("New Tag File");
        $("#modalContent").html(templates.newTagFileForm(data));
        $('#modal').modal();
    }

    function newTagFileCreate() {
        var tagFileName = $('#newTagFileName').val().trim();
        var re = /^[A-Za-z0-9_\-\.]+\.txt$/;
        if (!tagFileName.match(re)) {
            err = "Tag file name must contain at least one character and end with .txt";
            return newTagFileShowForm(err);
        }
        tagDefinitionShowForm(null, tagFileName);
    }

    function createProfileFromBuiltin(builtinId) {
        var profile = null;
        if (builtinId == builtins.APTrustProfileId) {
            profile = es.BagItProfile.fromStandardObject(builtins.APTrustProfile);
            profile.name = "APTrust";
            profile.description = "APTrust 2.0 default BagIt profile.";
        } else if (builtinId == builtins.DPNProfileId) {
            profile = es.BagItProfile.fromStandardObject(builtins.DPNProfile);
            profile.name = "DPN";
            profile.description = "Digital Preservation Network default BagIt profile.";
        }
        profile.baseProfileId = builtinId;
        for(var t of profile.requiredTags) {
            t.isBuiltIn = true;
        }
        profile.save();
        return profile;
    }

    // Initialize the BagItProfile DB if it's empty.
    if (Object.keys(es.DB.bagItProfiles.store).length == 0) {
        createProfileFromBuiltin(builtins.APTrustProfileId);
        createProfileFromBuiltin(builtins.DPNProfileId);
    }

    // This is for interactive testing in the console.
    window.es = es;
    window.templates = templates;
});
