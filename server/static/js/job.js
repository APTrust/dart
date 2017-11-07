// Functions for the jobs page.
$(function() {
	const fs = require('fs');
	const path = require('path');
	var kb = 1024;
	var mb = 1024 * kb;
	var gb = 1024 * mb;
	var tb = 1024 * gb;
	var filesAdded = {};
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

	$('#filesTable').on('click', '.deleteCell', function(){
		deleteFile(this);
	});

	function addFile(filepath) {
		$('#filesPanel').show()
		var stat = fs.statSync(filepath)
		var row = $(getTableRow(filepath, stat.isDirectory()))
		row.insertBefore('#fileTotals')
		filesAdded[filepath] = true
		fs.stat(filepath, function(err, stats) {
			statPath(err, stats, filepath, row)
		});
	};

	function deleteFile(cell) {
        var row = $(cell).parent('tr')
        var filepath = $(row).prop('id')
		var dirCountCell = $(row).children('.dirCount').first()
		var fileCountCell = $(row).children('.fileCount').first()
		var sizeCell = $(row).children('.fileSize').first()
		var count = parseInt(countCell.data('total'), 10) || 0
		var size = parseInt(sizeCell.data('total'), 10) || 0
		var dirCount = parseInt(dirCountCell.data('total'), 10) || 0

		for (var file in filesAdded) {
			if (file.indexOf(filepath) == 0) {
				delete filesAdded[file]
			}
		}
		delete filesAdded[filepath]

		var totalDirCountCell = $('#totalDirCount')
		var prevTotalDirCount = parseInt(totalDirCountCell.data('total'), 10) || 0
		totalDirCountCell.data('total', (prevTotalDirCount - dirCount))
		totalDirCountCell.text(prevTotalDirCount - dirCount)

		var totalCountCell = $('#totalFileCount')
		var prevTotalCount = parseInt(totalCountCell.data('total'), 10) || 0
		totalCountCell.data('total', (prevTotalCount - count))
		totalCountCell.text(prevTotalCount - count)

		var totalSizeCell = $('#totalFileSize')
		var prevTotalSize = parseInt(totalSizeCell.data('total'), 10) || 0
		totalSizeCell.data('total', (prevTotalSize - size))
		totalSizeCell.text(formatFileSize(prevTotalSize - size))

		$(row).remove()
	};

	function statPath(err, stats, filepath, row) {
		if (err != null) {
			console.log(err)
			return
		}
		if (stats.isFile()) {
			if (filesAdded[filepath] == true) {
				console.log(filepath + ' has already been added')
				return
			}
			updateFileStats(stats, row)
			filesAdded[filepath] = true
		} else if (stats.isDirectory()) {
			recurseIntoDir(filepath, row)
		} else {
			console.log("Other -> " + filepath)
		}
	}

	function recurseIntoDir(filepath, row) {
        updateStats(row, '.dirCount', 1)
		fs.readdir(filepath, function(err, files) {
			if (err != null) {
				console.log(err)
				return
			}
			files.forEach(function (file) {
				var fullpath = path.join(filepath, file)
				fs.stat(fullpath, function(err, stats) {
					statPath(err, stats, fullpath, row)
				});
			});
		});
	}

	function updateFileStats(stats, row) {
        updateStats(row, '.fileCount', 1)
        updateStats(row, '.fileSize', stats.size)
	}

    function updateStats(row, cssClass, amountToAdd) {
        var cell = $(row).find(cssClass).first()
        var prevValue = parseInt(cell.data('total'), 10) || 0
        var newValue = prevValue + amountToAdd
                cell.data('total', newValue)
        if (cssClass.indexOf('Count') > 0) {
            cell.text(newValue)
        } else {
            cell.text(formatFileSize(newValue))
        }

        var totalCell = getTotalCell(cssClass)
        prevValue = parseInt(totalCell.data('total'), 10) || 0
        newValue = prevValue + amountToAdd
        totalCell.data('total', newValue)
        if (cssClass.indexOf('Count') > 0) {
            totalCell.text(newValue)
        } else {
            totalCell.text(formatFileSize(newValue))
        }
    }

    function getTotalCell(cssClass) {
        switch(cssClass) {
            case '.dirCount':
            return $('#totalDirCount')
            case '.fileCount':
            return $('#totalFileCount')
            case '.fileSize':
            return $('#totalFileSize')
        }
        return null
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

	function getTableRow(filepath, isDir) {
		var icon = getIconForPath(filepath, isDir)
		return `<tr data-filepath="${filepath}">
			<td>${icon}</td>
			<td class="dirCount">0</td>
			<td class="fileCount">0</td>
			<td class="fileSize">0</td>
			<td class="deleteCell"><span class="glyphicon glyphicon-remove clickable-row" aria-hidden="true"></td>
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
