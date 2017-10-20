$(function() {
    $(".clickable-row").click(function () {
        var row = jQuery(this).closest("tr")
        var href = row.data("href")
        window.location = href
    });
    var elements = $("select[name='WorkflowID']")
    if (elements.length > 0) {
        var workflowList = elements[0]
        $(workflowList).change(function () {
            var parts = document.location.pathname.split('/')
            var id = parts[2]
            if (id == 'new') { id = '0' }
            document.forms[0].method = 'post'
            document.forms[0].action = "/job/" + id + "/workflow_changed"
            //console.log(document.forms[0].action)
            document.forms[0].submit()
        });
    }
});
