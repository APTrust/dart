$(function() {
    $(".clickable-row").click(function () {
        var row = jQuery(this).closest("tr")
        var href = row.data("href")
        window.location = href
    });
});
