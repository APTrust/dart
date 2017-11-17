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

    // StorageService Form
    $(document).on("click", "#btnNewStorageService", function() { storageServiceShowForm(null); });
    $(document).on("click", "#btnStorageServiceSave", storageServiceSave);

    // BagItProfile Form
    $(document).on("click", "#btnNewBagItProfile", function() { bagItProfileShowForm(null); });
    $(document).on("click", "#btnBagItProfileSave", bagItProfileSave);

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
            tagDefinitionShowForm(id);
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
        if (!es.Util.isEmpty(id)) {
            setting = es.AppSetting.find(id);
        }
        $("#container").html(templates.appSettingForm(setting.toForm()));
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
            $("#container").html(templates.appSettingForm(form));
        }
        es.ActiveObject = setting;
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
        if (!es.Util.isEmpty(id)) {
            profile = es.BagItProfile.find(id);
        }
        var data = {};
        data['form'] = profile.toForm();
        data['tags'] = profile.tagsGroupedByFile();
        $("#container").html(templates.bagItProfileForm(data));
        es.ActiveObject = profile;
    }

    function bagItProfileSave() {
        var profile = es.BagItProfile.fromForm();
        var result = profile.validate();
        if (result.isValid()) {
            profile.save();
            var data = {};
            data.success = `Profile ${profile.name} has been saved`;
            data.items = es.Util.sortByName(es.DB.bagItProfiles.store);
            $("#container").html(templates.bagItProfileList(data));
        } else {
            var form = profile.toForm();
            form.setErrors(result.errors);
            $("#container").html(templates.bagItProfileForm(form));
        }
        es.ActiveObject = profile;
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
        if (!es.Util.isEmpty(id)) {
            service = es.StorageService.find(id);
        }
        $("#container").html(templates.storageServiceForm(service.toForm()));
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
            $("#container").html(templates.storageServiceForm(form));
        }
        es.ActiveObject = service;
    }


    // Tag Definition functions
    function tagDefinitionShowForm(id) {
        var tag = es.ActiveObject.findTagById(id);
        console.log(tag);
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
