$(function() {
    const path = require("path");
    const es = require(path.resolve('electron/easy/easy_store'));
    const templates = require(path.resolve('electron/easy/templates'));

	$(".clickable-row").click(function () {
		var row = jQuery(this).closest("tr")
		var href = row.data("href")
		window.location = href
	});


    $("#menuAppSettingList").click(function() {
        var data = {};
        data.items = es.Util.sortStore(es.DB.appSettings.store)
        $("#container").html(templates.appSettingList(data));
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
