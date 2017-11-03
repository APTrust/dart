// Functions for the jobs page.
$(function() {
    const fs = require('fs');
    var stat = null;
    var body = document.getElementsByTagName("body")[0];
    body.addEventListener('drop', function (e) {
	    e.preventDefault();
	    e.stopPropagation();
	    for (let f of e.dataTransfer.files) {
            addFile(f.path)
	    }
    });

    body.addEventListener('dragover', function (e) {
	    e.preventDefault();
	    e.stopPropagation();
    });

    function addFile(filepath) {
        var rowNumber = $("#filesTable > tbody tr").length
        var row = getTableRow(filepath, rowNumber)
        console.log(row)
        $(row).insertBefore('#fileTotals')
    };

    function deleteFile() {

    };

    function getTableRow(filepath, rowNumber) {
        var icon = getIconForPath(filepath)
        return `<tr id="${filepath}">
            <td>${icon} <input type="hidden" name="files" value="${filepath}"/></td>
            <td id="fileCount${rowNumber}">0</td>
            <td id="fileSize${rowNumber}">0</td>
            </tr>`
    }

    function getIconForPath(filepath) {
        var stat = fs.statSync(filepath)
        if (stat.isDirectory()) {
            return getFolderIcon(filepath)
        }
        return getFileIcon(filepath)
    }

    function getFileIcon(filepath) {
        return '<span class="glyphicon glyphicon-file" aria-hidden="true" style="margin-right:10px"></span>' + filepath;
    }

    function getFolderIcon(filepath) {
        return '<span class="glyphicon glyphicon-folder-close" aria-hidden="true" style="margin-right:10px"></span>' + filepath;
    }

});
