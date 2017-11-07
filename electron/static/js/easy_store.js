$(function() {
	$(".clickable-row").click(function () {
		var row = jQuery(this).closest("tr")
		var href = row.data("href")
		window.location = href
	});
	var elements = $("select[name='BagItProfileID']")
	if (elements.length > 0) {
		var profileList = elements[0]
		$(profileList).change(function () {
			var parts = document.location.pathname.split('/')
			var id = parts[2]
			if (id == 'new') { id = '0' }
			document.forms[0].method = 'post'
			document.forms[0].action = "/job/" + id + "/profile_changed"
			document.forms[0].submit()
		});
	}
});
