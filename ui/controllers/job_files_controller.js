const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const FileSystemReader = require('../../plugins/formats/read/file_system_reader');
const fs = require('fs');
const { Job } = require('../../core/job');
const { JobTagsForm } = require('../forms/job_tags_form');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

/**
 * The JobFilesController displays the Job files page, where
 * users can drag and drop the files that a Job will package
 * and/or uploade.
 *
 * @param {URLSearchParams} params - The URL search params parsed
 * from the URL used to reach this page. This should contain at
 * least the Job Id.
 *
 * @param {string} params.id - The id of the Job being worked
 * on. Job.id is a UUID string.
 */
class JobFilesController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = Job.find(this.params.get('id'));
    }


    /**
     * This displays the Job files UI, where the user can drag
     * and drop files.
     */
    show() {
        let data = {
            alertMessage: this.alertMessage,
            job: this.job
        }
        this.alertMessage = null;
        let html = Templates.jobFiles(data);
        return this.containerContent(html);
    }


    /**
     * This attaches required events to the Job files UI and
     * adds the list of files and folders to be packaged to
     * the UI.
     */
    postRenderCallback(fnName) {
        this.attachDragAndDropEvents();
        this.attachDeleteEvents();
        this.addItemsToUI();
    }

    /**
     * This attaches drag and drop events, so users can add files
     * and folders to the job by dragging them into the application
     * window.
     */
    attachDragAndDropEvents() {
        let controller = this;
        $('#dropZone').on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // When drag event is attached to document, use
            // e.dataTransfer.files instead of what's below.
            for (let f of e.originalEvent.dataTransfer.files) {
                let containingItem = controller.findContainingItem(f.path);
                if (containingItem) {
                    let msg = Context.y18n.__(
                        '%s has already been added to this package as part of %s',
                        `${f.path}\n\n`,
                        `\n\n${containingItem}`
                    );
                    alert(msg);
                    continue;
                }
                controller.addFileToPackageSources(f.path);
                controller.addItemToUI(f.path);
                controller.job.save();
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

    /**
     * This attaches the deletion handler to the red X beside
     * each file and folder. Clicking the red delete icon causes
     * the filepath to be removed from the UI and from this Job's
     * list of sourceFiles in {@link PackageOperation}.
     */
    attachDeleteEvents() {
        let controller = this;
        $('#filesTable').on('click', 'td.delete-file', function(e) {
            let filepath = $(e.currentTarget).data('filepath');
            controller.removeItemFromUI(filepath);
            Util.deleteFromArray(controller.job.packageOp.sourceFiles, filepath);
            controller.job.save();
            return false;
        });
    }


    /**
     * This adds files and folders to the display.
     */
    addItemsToUI() {
        // Do not try to process any files or directories that
        // the user may have deleted.
        this.job.packageOp.pruneSourceFilesUnlessJobCompleted();
        var files = this.job.packageOp.sourceFiles.slice();
        for(var filepath of files) {
            this.addItemToUI(filepath);
        }
    }

    /**
     * This adds a single file or folder to the UI.
     */
    addItemToUI(filepath) {
        let controller = this;
        let stats = fs.statSync(filepath);
        if (stats.isFile()) {
            this.addRow(filepath, 'file', 1, 0, stats.size);
        } else if (stats.isDirectory()) {
            let fsReader = new FileSystemReader(filepath);
            fsReader.on('end', function() {
                controller.addRow(filepath, 'directory', fsReader.fileCount,
                              fsReader.dirCount, fsReader.byteCount);
            });
            fsReader.list();
        }
    }

    /**
     * This adds one row to the table that lists which files and
     * folders this job will package.
     *
     * @param {string} filepath - The absolute path to a file or folder
     * that is to be packaged as part of this job.
     *
     * @param {string} type - The type of item that filepath represents.
     * This should be either "file" or "directory".
     *
     * @param {number} fileCount - The number of files contained by the
     * item in param filepath. For files, this will be 1. For directories,
     * it will be the total number of files in the directory and all of
     * its subdirectories. (This info is readily available from the
     * {@link FileSystemReader} plugin.)
     *
     * @param {number} dirCount - The number of directories contained by
     * the item in param filepath. For files, this will be 0. For directories,
     * this will be 1 (for the directory itself) plus the total count of
     * all directories within that directory and all of its subdirectories.
     * (This info is readily available from the {@link FileSystemReader}
     * plugin.)
     *
     * @param {number} byteCount - The total number of bytes contained by
     * the item at filepath. For files, this will be the filesize. For
     * directories, this will be the sum of bytes contained by all the files
     * within the directory and all its subdirectories. (This info is readily
     * available from the {@link FileSystemReader} plugin.)
     *
     */
    addRow(filepath, type, fileCount, dirCount, byteCount) {
        $('#filesPanel').show();
        let row = this.getTableRow(filepath, type, fileCount, dirCount, byteCount);
        $(row).insertBefore('#fileTotals');
        this.updateTotals(fileCount, dirCount, byteCount);
    }

    /**
     * Updates the total number of files, folders, and bytes to be
     * packaged.
     *
     * @param {number} fileCount - The number of files contained by the
     * item in param filepath. For files, this will be 1. For directories,
     * it will be the total number of files in the directory and all of
     * its subdirectories. (This info is readily available from the
     * {@link FileSystemReader} plugin.) This number will be added to
     * the total file count.
     *
     * @param {number} dirCount - The number of directories contained by
     * the item in param filepath. For files, this will be 0. For directories,
     * this will be 1 (for the directory itself) plus the total count of
     * all directories within that directory and all of its subdirectories.
     * (This info is readily available from the {@link FileSystemReader}
     * plugin.) This number will be added to the total directory count.
     *
     * @param {number} byteCount - The total number of bytes contained by
     * the item at filepath. For files, this will be the filesize. For
     * directories, this will be the sum of bytes contained by all the files
     * within the directory and all its subdirectories. (This info is readily
     * available from the {@link FileSystemReader} plugin.) This number will
     * be added to the total byte count.
     *
     */
    updateTotals(fileCount, dirCount, byteCount) {
        let filesTotal = this.updateTotal('#totalFileCount', fileCount);
        let dirTotal = this.updateTotal('#totalDirCount', dirCount);
        let byteTotal = this.updateTotal('#totalByteCount', byteCount);
        this.job.fileCount = filesTotal;
        this.job.dirCount = dirTotal;
        this.job.byteCount = byteTotal;
    }

    /**
     * Updates one of the total fields at the bottom of the list of
     * files and folders, and returns the calculated total.
     *
     * @param {string} elementId - The id (css selector) of the element
     * whose text should be updated.
     *
     * @param {number} amountToAdd - The number to add to the existing
     * total already displayed in the cell. This will be negative in
     * cases where you're removing files or folders.
     *
     * @returns {number} The total value displayed in the field.
     */
    updateTotal(elementId, amountToAdd) {
        let element = $(elementId);
        let newTotal = parseInt(element.data('total'), 10) + amountToAdd;
        element.data('total', newTotal);
        if (elementId == '#totalByteCount') {
            element.text(Util.toHumanSize(newTotal));
        } else {
            element.text(newTotal);
        }
        return newTotal;
    }

    /**
     * Returns the HTML for a single table row in the files/folders
     * display.
     *
     * @param {string} filepath - The absolute path to a file or folder
     * that is to be packaged as part of this job.
     *
     * @param {string} type - The type of item that filepath represents.
     * This should be either "file" or "directory".
     *
     * @param {number} fileCount - The number of files contained by the
     * item in param filepath. For files, this will be 1. For directories,
     * it will be the total number of files in the directory and all of
     * its subdirectories. (This info is readily available from the
     * {@link FileSystemReader} plugin.)
     *
     * @param {number} dirCount - The number of directories contained by
     * the item in param filepath. For files, this will be 0. For directories,
     * this will be 1 (for the directory itself) plus the total count of
     * all directories within that directory and all of its subdirectories.
     * (This info is readily available from the {@link FileSystemReader}
     * plugin.)
     *
     * @param {number} byteCount - The total number of bytes contained by
     * the item at filepath. For files, this will be the filesize. For
     * directories, this will be the sum of bytes contained by all the files
     * within the directory and all its subdirectories. (This info is readily
     * available from the {@link FileSystemReader} plugin.)
     *
     * @returns {string} A string of HTML representing a table row.
     */
    getTableRow(filepath, type, fileCount, dirCount, byteCount) {
        let iconType = (type == 'file' ? 'file' : 'folder-closed');
        let data = {
            iconType: iconType,
            filepath: filepath,
            dirCount: dirCount,
            fileCount: fileCount,
            byteCount: byteCount,
            size: Util.toHumanSize(byteCount)
        }
        return Templates.jobFileRow(data);
    }

    /**
     * This adds a file or folder to the list of items that will be
     * packaged in this job. The item is added to the sourceFiles
     * list of the Job's {@link PackageOperation} attribute.
     *
     * @param {string} filepath - The absolute path to a file or folder
     * that is to be packaged as part of this job.
     *
     */
    addFileToPackageSources(filepath) {
        if (!Array.isArray(this.job.packageOp.sourceFiles)) {
            this.job.packageOp.sourceFiles = [];
        }
        this.job.packageOp.sourceFiles.push(filepath);
    }

    /**
     * This checks the list of source files and folders to see if
     * any of the items already set to be packaged contains the item
     * that the user just dragged into the window. We make this check
     * to avoid adding duplicate files or folders to the list of
     * sources.
     *
     * @param {string} filepath - The absolute path to a file or folder
     * that is to be packaged as part of this job.
     *
     * @return {string} - The path the already-added folder that contains
     * filepath, or null if filepath's containing folder has not already
     * been added to the list of source files.
     *
     */
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

    /**
     * This deletes a file or folder from the list of files and folders
     * in the UI (but does not delete the item from the underlying
     * {@link PackageOperation}).
     *
     * @param {string} filepath - The absolute path to a file or folder
     * to be removed from the UI.
     *
     */
    removeItemFromUI(filepath) {
        let row = $(`tr[data-filepath="${filepath}"]`)
        let dirCount = -1 * parseInt(row.find('td.dirCount').text(), 10);
        let fileCount = -1 * parseInt(row.find('td.fileCount').text(), 10);
        let fileSize = -1 * parseInt(row.find('td.fileSize').data('bytes'), 10);
        row.remove();
        this.updateTotals(fileCount, dirCount, fileSize)
        if ($('tr.filepath').length == 0) {
            $('#filesPanel').hide();
        }
    }

}

module.exports.JobFilesController = JobFilesController;
