const fs = require('fs');
const FileSystemReader = require('../../plugins/formats/read/file_system_reader');
const Templates = require('../common/templates');
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
            $(e.currentTarget).addClass('drop-zone-over');
            return false;
        });
        $('#dropZone').on('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(e.currentTarget).removeClass('drop-zone-over');
            return false;
        });
        $('#dropZone').on('dragend', function(e) {
            e.preventDefault();
            e.stopPropagation();
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
            this.addRow(filepath, 'file', 1, 0, stats.size);
        } else if (stats.isDirectory()) {
            let fsReader = new FileSystemReader(filepath);
            fsReader.on('end', function() {
                helper.addRow(filepath, 'directory', fsReader.fileCount,
                              fsReader.dirCount, fsReader.byteCount);
            });
            fsReader.list();
        }
    }

    addRow(filepath, type, fileCount, dirCount, byteCount) {
        $('#filesPanel').show();
        $('#btnJobPackagingDiv').show();
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
        let iconType = (type == 'file' ? 'file' : 'folder-closed');
        let data = {
            iconType: iconType,
            filepath: filepath,
            dirCount: dirCount,
            fileCount: fileCount,
            size: Util.toHumanSize(byteCount)
        }
        return Templates.jobFileRow(data);
    }
}

module.exports.JobFileUIHelper = JobFileUIHelper;
