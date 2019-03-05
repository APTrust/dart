const { Context } = require('../../core/context');
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
        let helper = this;
        $('#dropZone').on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // When drag event is attached to document, use
            // e.dataTransfer.files instead of what's below.
            for (let f of e.originalEvent.dataTransfer.files) {
                let containingItem = helper.findContainingItem(f.path);
                if (containingItem) {
                    let msg = Context.y18n.__(
                        '%s has already been added to this package as part of %s',
                        `${f.path}\n\n`,
                        `\n\n${containingItem}`
                    );
                    alert(msg);
                    continue;
                }
                helper.addFileToPackageSources(f.path);
                helper.addItemToUI(f.path);
                helper.job.save();
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
        $('#filesTable').on('click', 'td.delete-file', function(e) {
            let filepath = $(e.currentTarget).data('filepath');
            helper.removeItemFromUI(filepath);
            Util.deleteFromArray(helper.job.packageOp.sourceFiles, filepath);
            helper.job.save();
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

    addFileToPackageSources(filepath) {
        if (this.job.packageOp == null) {
            this.job.packageOp = new PackageOperation();
        }
        if (!Array.isArray(this.job.packageOp.sourceFiles)) {
            this.job.packageOp.sourceFiles = [];
        }
        this.job.packageOp.sourceFiles.push(filepath);
    }

    findContainingItem(filepath) {
        if (Array.isArray(this.job.packageOp.sourceFiles)) {
            for (let item of this.job.packageOp.sourceFiles) {
                if (filepath.startsWith(item)) {
                    return item;
                }
            }
        }
        return null;
    }

    removeItemFromUI(filepath) {
        let row = $(`tr[data-filepath="${filepath}"]`)
        let dirCount = -1 * parseInt(row.find('td.dirCount').text(), 10);
        let fileCount = -1 * parseInt(row.find('td.fileCount').text(), 10);
        let fileSize = -1 * parseInt(row.find('td.fileSize').text(), 10);
        row.remove();
        this.updateTotals(fileCount, dirCount, fileSize)
        if ($('tr.filepath').length == 0) {
            $('#filesPanel').hide();
        }
    }

}

module.exports.JobFileUIHelper = JobFileUIHelper;
