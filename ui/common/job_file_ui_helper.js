const fs = require('fs');
const FileSystemReader = require('../../plugins/formats/read/file_system_reader');
const { Util } = require('../../core/util');

class JobFileUIHelper {
    constructor(job) {
        this.job = job;
    }

    initUI() {
        this.attachDragAndDropEvents();
        this.addItemsToUI();
    }

    attachDragAndDropEvents() {
        $('#dropZone').on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('drop');
            // When drag event is attached to document, use
            // e.dataTransfer.files instead of what's below.
            for (let f of e.originalEvent.dataTransfer.files) {
                //jobFiles.addFile(f.path);
                console.log(f.path);
            }
            $(e.currentTarget).removeClass('drop-zone-over');
            return false;
        });
        $('#dropZone').on('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('dragover');
            $(e.currentTarget).addClass('drop-zone-over');
            return false;
        });
        $('#dropZone').on('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('dragleave');
            $(e.currentTarget).removeClass('drop-zone-over');
            return false;
        });
        $('#dropZone').on('dragend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('dragend');
            $(e.currentTarget).removeClass('drop-zone-over');
            return false;
        });
    }

    addItemsToUI() {
        if (this.job.packageOp != null) {
            var files = this.job.packageOp.sourceFiles.slice();
            for(var filepath of files) {
                this.addItemToUI(filepath);
            }
        }
    }

    addItemToUI(filepath) {
        let helper = this;
        let stats = fs.statSync(filepath);
        if (stats.isFile()) {
            // Add row with file path, 1, 0, stats.size
            console.log(`${filepath}, 1, 0, ${stats.size}`);
            this.addRow(filepath, 'file', 1, 0, stats.size);
        } else if (stats.isDirectory()) {
            let fsReader = new FileSystemReader(filepath);
            fsReader.on('end', function() {
                // Add row with file path, fileCount, dirCount, byteCount
                console.log(`${filepath}, ${fsReader.fileCount}, ${fsReader.dirCount}, ${fsReader.byteCount}`);
                helper.addRow(filepath, 'directory', fsReader.fileCount,
                              fsReader.dirCount, fsReader.byteCount);
            });
            fsReader.list();
        }
    }

    addRow(filepath, type, fileCount, dirCount, byteCount) {
        $('#filesPanel').show();
        let row = this.getTableRow(filepath, type, fileCount, dirCount, byteCount);
        $(row).insertBefore('#fileTotals');
        this.updateTotals(fileCount, dirCount, byteCount);
    }

    updateTotals(fileCount, dirCount, byteCount) {
        this.updateTotal('#totalFileCount', fileCount);
        this.updateTotal('#totalDirCount', dirCount);
        this.updateTotal('#totalByteCount', byteCount);
    }

    updateTotal(elementId, amountToAdd) {
        let element = $(elementId);
        let newTotal = parseInt(element.data('total'), 10) + amountToAdd;
        element.data('total', newTotal);
        if (elementId == '#totalByteCount') {
            element.text(Util.toHumanSize(newTotal));
        } else {
            element.text(newTotal);
        }
    }

    getTableRow(filepath, type, fileCount, dirCount, byteCount) {
        let icon = this.getIconForPath(filepath, type)
        let size = Util.toHumanSize(byteCount);
        return `<tr data-filepath="${filepath}" data-object-type="File">
            <td>${icon}</td>
            <td class="dirCount">${dirCount}</td>
            <td class="fileCount">${fileCount}</td>
            <td class="fileSize">${size}</td>
            <td class="deleteCell"><span class="glyphicon glyphicon-remove clickable-row" aria-hidden="true"></td>
            </tr>`
    }

    getIconForPath(filepath, type) {
        if (type == 'directory') {
            return this.getFolderIcon(filepath)
        }
        return this.getFileIcon(filepath)
    }

    getFileIcon(filepath) {
        return `<span class="glyphicon glyphicon-file" aria-hidden="true" style="margin-right:10px"></span>${filepath}`;
    }

    getFolderIcon(filepath) {
        return `<span class="glyphicon glyphicon-folder-close" aria-hidden="true" style="margin-right:10px"></span>${filepath}`;
    }
}

module.exports.JobFileUIHelper = JobFileUIHelper;
