// Functions for the jobs page.
$(function() {
    const fs = require('fs');
    var kb = 1024;
    var mb = 1024 * kb;
    var gb = 1024 * mb;
    var tb = 1024 * gb;
    var alreadyAdded = {};
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
        var stat = fs.statSync(filepath)
        var row = getTableRow(filepath, rowNumber, stat.isDirectory())
        $(row).insertBefore('#fileTotals')
        alreadyAdded[filepath] = true
        fs.stat(filepath, function(err, stats) {
            statPath(err, stats, rowNumber)
        });
    };

    function deleteFile(filepath) {
        // TODO: Delete table row
        delete alreadyAdded[filepath]
    };

    function statPath(err, stats, rowNumber) {
        //if stats.isDirectory() {
          // use fs.readdir()
        //}
        if (err != null) {
            console.log(err)
            return
        }
        var countCell = $('#fileCount' + rowNumber)
        var sizeCell = $('#fileSize' + rowNumber)
        var prevCount = parseInt(countCell.text(), 10)
        var prevSize = parseInt(sizeCell.text(), 10)
        countCell.text(prevCount + 1)
        sizeCell.text(formatFileSize(prevSize + stats.size))
        console.log("Count: " + prevCount + 1)
        console.log("Size: " + formatFileSize(prevSize + stats.size))
        // TODO: Totals in last row
    }

    function formatFileSize(size) {
        if (size > tb) {
            return (size / tb).toFixed(2) + " TB"
        }
        if (size > gb) {
            return (size / gb).toFixed(2) + " GB"
        }
        if (size > mb) {
            return (size / mb).toFixed(2) + " MB"
        }
        return size + " KB"
    }

    function getTableRow(filepath, rowNumber, isDir) {
        var icon = getIconForPath(filepath)
        return `<tr id="${filepath}">
            <td>${icon} <input type="hidden" name="files" value="${filepath}"/></td>
            <td id="fileCount${rowNumber}">0</td>
            <td id="fileSize${rowNumber}">0</td>
            </tr>`
    }

    function getIconForPath(filepath, isDir) {
        if (isDir) {
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
