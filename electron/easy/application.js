$(function() {
    const path = require("path");
    const es = require(path.resolve('electron/easy/easy_store'));
    const templates = require(path.resolve('electron/easy/templates'));

    // Top nav menu
    $("#menuAppSettingList").on('click', appSettingShowList);
    $("#menuBagItProfileList").click(bagItProfileShowList);
    $("#menuStorageServiceList").click(storageServiceShowList);

    // AppSetting Form
    $(document).on("click", "#btnNewAppSetting", function() { appSettingShowForm(null); });
    $(document).on("click", "#btnApplicationSettingSave", appSettingSave);
    $(document).on("click", "#btnApplicationSettingDelete", appSettingDelete);

    // BagItProfile Form
    $(document).on("click", "#btnNewBagItProfile", function() { bagItProfileShowForm(null); });
    $(document).on("click", "#btnBagItProfileSave", bagItProfileSave);
    $(document).on("click", "#btnBagItProfileDelete", bagItProfileDelete);

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
    function appSettingShowList() {
        var data = {};
        data.items = es.Util.sortByName(es.DB.appSettings.store);
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
            var data = {};
            data.success = `Setting ${setting.name} has been saved`;
            data.items = es.Util.sortByName(es.DB.appSettings.store);
            $("#container").html(templates.appSettingList(data));
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
        es.ActiveObject.delete();
        appSettingShowList();
    }

    // BagItProfile functions
    function bagItProfileShowList() {
        var data = {};
        data.items = es.Util.sortByName(es.DB.bagItProfiles.store)
        $("#container").html(templates.bagItProfileList(data));
        es.ActiveObject = data.items;
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
            bagItProfileShowList();
            return
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
        es.ActiveObject.delete();
        bagItProfileShowList();
    }

    // StorageService functions
    function storageServiceShowList() {
        var data = {};
        data.items = es.Util.sortByName(es.DB.storageServices.store)
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
            var data = {};
            data.success = `Storage service ${service.name} has been saved`;
            data.items = es.Util.sortByName(es.DB.storageServices.store);
            $("#container").html(templates.storageServiceList(data));
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
        es.ActiveObject.delete();
        storageServiceShowList();
    }


    // Tag Definition functions
    function tagDefinitionShowForm(id, tagFile) {
        var tag = es.ActiveObject.findTagById(id);
        var showDeleteButton = true;
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


    // Initialize the BagItProfile DB if it's empty.
    if (Object.keys(es.DB.bagItProfiles.store).length == 0) {
        var builtins = require(path.resolve('electron/easy/builtin_profiles'));
        var aptrust = es.BagItProfile.fromStandardObject(builtins.APTrustProfile);
        aptrust.id = builtins.APTrustProfileId;
        aptrust.name = "APTrust";
        aptrust.description = "APTrust 2.0 default BagIt profile.";
        aptrust.save();
        var dpn = es.BagItProfile.fromStandardObject(builtins.DPNProfile);
        dpn.id = builtins.DPNProfileId;
        dpn.name = "DPN";
        dpn.description = "Digital Preservation Network default BagIt profile.";
        dpn.save();
    }

    // This is for interactive testing in the console.
    window.es = es;
    window.templates = templates;
});
