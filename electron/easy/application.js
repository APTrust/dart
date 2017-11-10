$(function() {
    const path = require("path");
    const es = require(path.resolve('electron/easy/easy_store'));
    const templates = require(path.resolve('electron/easy/templates'));

    $(document).on("click", ".clickable-row", function() {
		var id = $(this).data("object-id");
        console.log(id);
	});


    $("#menuAppSettingList").on('click', function() {
        var data = {};
        data.items = es.Util.sortStore(es.DB.appSettings.store);
        $("#container").html(templates.appSettingList(data));
    });

    $(document).on("click", "#btnNewAppSetting", function() {
        var setting = new es.AppSetting();
        $("#container").html(templates.appSettingForm(setting.toForm()));
    });

    $(document).on("click", "#btnApplicationSettingSave", function() {
        var setting = es.AppSetting.fromForm();
        var validationResult = setting.validate();
        if (validationResult.isValid()) {
            setting.save();
            var data = {};
            data.success = `Setting ${setting.name} has been saved`;
            data.items = es.Util.sortStore(es.DB.appSettings.store);
            $("#container").html(templates.appSettingList(data));
        } else {
            var form = setting.toForm();
            form.setErrors(validationResult.errors);
            $("#container").html(templates.appSettingForm(form));
        }
    });


    $("#menuBagItProfileList").click(function() {
        var data = {};
        data.items = es.Util.sortStore(es.DB.profiles.store)
        $("#container").html(templates.profileList(data));
    });
    $("#menuStorageServiceList").click(function() {
        var data = {};
        data.items = es.Util.sortStore(es.DB.storageServices.store)
        $("#container").html(templates.storageServiceList(data));
    });


    // This is for interactive testing in the console.
    window.es = es;
    window.templates = templates;
});
