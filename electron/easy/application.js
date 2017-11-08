$(function() {
    const path = require("path");
    const es = require(path.resolve('electron/easy/easy_store'))
	$(".clickable-row").click(function () {
		var row = jQuery(this).closest("tr")
		var href = row.data("href")
		window.location = href
	});



    // This is for interactive testing in the console.
    window.es = es;

});
