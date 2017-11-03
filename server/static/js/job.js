// Functions for the jobs page.
$(function() {
    const fs = require('fs');
    const path = require('path');
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
            statPath(err, stats, filepath, rowNumber)
        });
    };

    function deleteFile(filepath) {
        // TODO: Delete table row
        delete alreadyAdded[filepath]
    };

    function statPath(err, stats, filepath, rowNumber) {
        // TODO: Recursion isn't working - bad filepaths.
        // TODO: Count directories separately.
        // TODO: Skip .DS_Store and other junk files.
        if (stats.isDirectory()) {
            fs.readdir(filepath, function(err, files) {
                if (err != null) {
                    console.log(err)
                    return
                }
                for (var i=0; i < files.length; i++) {
                    var fullpath = path.join(filepath, files[i])
                    fs.stat(fullpath, function(err, stats) {
                        statPath(err, stats, fullpath, rowNumber)
                    });
                }
            });
        }
        if (err != null) {
            console.log(err)
            return
        }
        var countCell = $('#fileCount' + rowNumber)
        var sizeCell = $('#fileSize' + rowNumber)
        var totalCountCell = $('#totalFileCount')
        var totalSizeCell = $('#totalFileSize')
        var prevCount = parseInt(totalCountCell.data('total'), 10)
        var prevSize = parseInt(totalSizeCell.data('total'), 10)
        var newCount = prevCount + 1
        var newSize = prevSize + stats.size
        countCell.text(newCount)
        totalCountCell.data('total', newCount)
        sizeCell.text(formatFileSize(newSize))
        totalSizeCell.data('total', newSize)
        console.log(filepath + " " + newCount + " " + stats.size)
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
        return (size / kb).toFixed(2) + " KB"
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
