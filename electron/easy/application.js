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
         default:
            alert(`Type ${type}? WTF?`);
        }
	});

    // App Setting functions
    function appSettingShowList() {
        var data = {};
        data.items = es.Util.sortStore(es.DB.appSettings.store);
        $("#container").html(templates.appSettingList(data));
    }

    function appSettingShowForm(id) {
        var setting = new es.AppSetting();
        if (!es.Util.isEmpty(id)) {
            setting = es.AppSetting.find(id);
        }
        console.log(id)
        console.log(setting)
        $("#container").html(templates.appSettingForm(setting.toForm()));
    }

    function appSettingSave() {
        var setting = es.AppSetting.fromForm();
        var result = setting.validate();
        if (result.isValid()) {
            setting.save();
            var data = {};
            data.success = `Setting ${setting.name} has been saved`;
            data.items = es.Util.sortStore(es.DB.appSettings.store);
            $("#container").html(templates.appSettingList(data));
        } else {
            var form = setting.toForm();
            form.setErrors(result.errors);
            $("#container").html(templates.appSettingForm(form));
        }
    }

    // BagItProfile functions
    function bagItProfileShowList() {
        var data = {};
        data.items = es.Util.sortStore(es.DB.bagItProfiles.store)
        $("#container").html(templates.bagItProfileList(data));
    }

    function bagItProfileShowForm(id) {
        var profile = new es.BagItProfile();
        if (!es.Util.isEmpty(id)) {
            profile = es.BagItProfile.find(id);
        }
        $("#container").html(templates.bagItProfileForm(profile.toForm()));

        // DEBUG
        window.profile = profile;
        // END DEBUG

    }

    function bagItProfileSave() {
        var profile = es.BagItProfile.fromForm();
        var result = profile.validate();
        if (result.isValid()) {
            profile.save();
            var data = {};
            data.success = `Profile ${profile.name} has been saved`;
            data.items = es.Util.sortStore(es.DB.bagItProfiles.store);
            $("#container").html(templates.bagItProfileList(data));
        } else {
            var form = profile.toForm();
            form.setErrors(result.errors);
            $("#container").html(templates.bagItProfileForm(form));
        }
    }

    // StorageService functions
    function storageServiceShowList() {
        var data = {};
        data.items = es.Util.sortStore(es.DB.storageServices.store)
        $("#container").html(templates.storageServiceList(data));
    }

    function storageServiceShowForm(id) {
        var service = new es.StorageService();
        if (!es.Util.isEmpty(id)) {
            service = es.StorageService.find(id);
        }
        $("#container").html(templates.storageServiceForm(service.toForm()));
    }

    function storageServiceSave() {
        var service = es.StorageService.fromForm();
        var result = service.validate();
        if (result.isValid()) {
            service.save();
            var data = {};
            data.success = `Storage service ${service.name} has been saved`;
            data.items = es.Util.sortStore(es.DB.storageServices.store);
            $("#container").html(templates.storageServiceList(data));
        } else {
            var form = service.toForm();
            form.setErrors(result.errors);
            $("#container").html(templates.storageServiceForm(form));
        }
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
