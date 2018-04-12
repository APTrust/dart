const fs = require('fs');
const { Job } = require('../core/job');
const log = require('../core/log');
const path = require('path');
const { Util } = require('../core/util');

// UI manager for the job_files.html template,
// where user adds files to a job.
class JobFiles {

    constructor(job) {
        this.job = job;
    }

    initEvents() {
        $('#linkAdvanced').click(function() { $("#divAdvanced").toggle(); });

        $("input[name=filesOptionDSStore]").change(function() {
            $('#spinner').show();
            setTimeout(function() {
                jobFiles.fileOptionsChanged();
                $('#spinner').hide();
            }, 300);
        });

        $("input[name=filesOptionHidden]").change(function() {
            $('#spinner').show();
            setTimeout(function() {
                jobFiles.fileOptionsChanged();
                $('#spinner').hide();
            }, 300);
        });

        $("#btnJobPackaging").click(function () {
            var data = {};
            data.form = jobFiles.job.toPackagingForm();
            data.domainName = es.AppSetting.findByName("Institution Domain").value;
            data.showProfileList = data.form.fields.packageFormat.getSelected() == "BagIt";
            $("#container").html(es.Templates.jobPackaging(data));
        });

        $('#dropZone').on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // When drag event is attached to document, use
            // e.dataTransfer.files instead of what's below.
            for (let f of e.originalEvent.dataTransfer.files) {
                jobFiles.addFile(f.path);
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

        $('#divJobFiles').on('click', '.deleteCell', function(){
            jobFiles.deleteFile(this);
        });

        $('#spinner').show();
        setTimeout(function() {
            jobFiles.setFileListUI();
            $('#spinner').hide();
        }, 300);

    }

    // We call this when we load an existing job, so the list of
    // files, file sizes, etc. shows up in the UI.
    setFileListUI() {
        var files = this.job.files.slice();
        this.job.files = [];
        for(var filepath of files) {
            this.addFile(filepath);
        }
    }

    fileOptionsChanged() {
        this.job.options.skipDSStore = $('#filesSkipDSStore').prop('checked');
        this.job.options.skipHiddenFiles = $('#filesSkipHidden').prop('checked');
        this.job.options.skipDotKeep = $('#filesSkipDotKeep').prop('checked');
        var ui = this;
        $.each($("tr[data-object-type='File']"), function(index, row) {
            var filepath = $(row).data('filepath');
            ui.deleteFile($(row).find('td').first());
            ui.addFile(filepath);
        });
    }

    addFile(filepath) {
        $('#filesPanel').show()
        $('#fileWarningContainer').hide();
        if (this.job.hasFile(filepath)) {
            $('#fileWarning').html(filepath + ' has already been added')
            $('#fileWarningContainer').show();
            return
        }
        var stats = null;
        try {
            stats = fs.statSync(filepath)
        } catch (ex) {
            if (ex.toString().includes('ENOENT')) {
                alert(`File ${filepath} no longer exists and will not be part of this bag.`);
            }
            log.error(`Cannot add file ${filepath}. Error follows.`)
            log.error(ex)
            return;
        }
        var row = $(this.getTableRow(filepath, stats.isDirectory()))
        row.insertBefore('#fileTotals')
        var ui = this;

        if (!stats.isDirectory()) {
            ui.updateFileStats(stats, row)
        } else {
            var filterFunction = function(filepath) { return Job.shouldIncludeFile(filepath, ui.job.options); };
            var files = Util.walkSync(filepath, [], filterFunction);
            var dirsAdded = {};
            for (var f of files) {
                if (f.stats.isFile()) {
                    var dirname = path.dirname(f.absPath);
                    if (!dirsAdded[dirname]) {
                        ui.updateStats(row, '.dirCount', 1);
                        dirsAdded[dirname] = true;
                    }
                    ui.updateFileStats(f.stats, row);
                }
            }
        }

        this.job.files.push(filepath)
        $('#btnJobPackagingDiv').show();
    }

    deleteFile(cell) {
        $('#fileWarningContainer').hide();
        var row = $(cell).parent('tr')
        var filepath = $(row).data('filepath')
        var removeIndex = this.job.files.indexOf(filepath);
        if (removeIndex > -1) {
            this.job.files.splice(removeIndex, 1);
        }
        this.updateStatsForDeletion(row);
        $(row).remove()
        if (!this.job.hasFiles()) {
            $('#btnJobPackagingDiv').hide();
        }
    }

    updateFileStats(stats, row) {
        this.updateStats(row, '.fileCount', 1)
        this.updateStats(row, '.fileSize', stats.size)
    }

    updateStats(row, cssClass, amountToAdd) {
        var cell = $(row).find(cssClass).first()
        var prevValue = parseInt(cell.data('total'), 10) || 0
        var newValue = prevValue + amountToAdd
        cell.data('total', newValue)
        if (cssClass.indexOf('Count') > 0) {
            cell.text(newValue)
        } else {
            cell.text(Util.toHumanSize(newValue))
        }

        var totalCell = this.getTotalCell(cssClass)
        prevValue = parseInt(totalCell.data('total'), 10) || 0
        newValue = prevValue + amountToAdd
        totalCell.data('total', newValue)
        if (cssClass.indexOf('Count') > 0) {
            totalCell.text(newValue)
        } else {
            totalCell.text(Util.toHumanSize(newValue))
        }
        if (cssClass == '.fileSize') {
            this.job.payloadSize = newValue;
        }
    }

    getTotalCell(cssClass) {
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

    updateStatsForDeletion(row) {
        var dirCountCell = $(row).children('.dirCount').first()
        var fileCountCell = $(row).children('.fileCount').first()
        var sizeCell = $(row).children('.fileSize').first()
        var fileCount = parseInt(fileCountCell.data('total'), 10) || 0
        var size = parseInt(sizeCell.data('total'), 10) || 0
        var dirCount = parseInt(dirCountCell.data('total'), 10) || 0
        var totalDirCountCell = $('#totalDirCount')
        var prevTotalDirCount = parseInt(totalDirCountCell.data('total'), 10) || 0
        totalDirCountCell.data('total', (prevTotalDirCount - dirCount))
        totalDirCountCell.text(prevTotalDirCount - dirCount)
        var totalFileCountCell = $('#totalFileCount')
        var prevTotalFileCount = parseInt(totalFileCountCell.data('total'), 10) || 0
        totalFileCountCell.data('total', (prevTotalFileCount - fileCount))
        totalFileCountCell.text(prevTotalFileCount - fileCount)
        var totalSizeCell = $('#totalFileSize')
        var prevTotalSize = parseInt(totalSizeCell.data('total'), 10) || 0
        totalSizeCell.data('total', (prevTotalSize - size))
        totalSizeCell.text(Util.toHumanSize(prevTotalSize - size))
        this.job.payloadSize = (prevTotalSize - size);
    }

    getTableRow(filepath, isDir) {
        var icon = this.getIconForPath(filepath, isDir)
        return `<tr data-filepath="${filepath}" data-object-type="File">
            <td>${icon}</td>
            <td class="dirCount">0</td>
            <td class="fileCount">0</td>
            <td class="fileSize">0</td>
            <td class="deleteCell"><span class="glyphicon glyphicon-remove clickable-row" aria-hidden="true"></td>
            </tr>`
    }

    getIconForPath(filepath, isDir) {
        if (isDir) {
            return this.getFolderIcon(filepath)
        }
        return this.getFileIcon(filepath)
    }

    getFileIcon(filepath) {
        return '<span class="glyphicon glyphicon-file" aria-hidden="true" style="margin-right:10px"></span>' + filepath;
    }

    getFolderIcon(filepath) {
        return '<span class="glyphicon glyphicon-folder-close" aria-hidden="true" style="margin-right:10px"></span>' + filepath;
    }

}


module.exports.JobFiles = JobFiles;
