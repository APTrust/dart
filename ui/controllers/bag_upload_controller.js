const $ = require('jquery');
const { BagUploadForm } = require('../forms/bag_upload_form');
const { Context } = require('../../core/context');
const { DartProcess } = require('../../core/dart_process');
const { fork } = require('child_process');
const fs = require('fs');
const { Job } = require('../../core/job');
const path = require('path');
const { RunningJobsController } = require('./running_jobs_controller');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

/**
 * The BagUploadController presents a page on which users can
 * validate a bag against a BagIt profile.
 *
 * @param {URLSearchParams} params - The URL search params parsed
 * from the URL used to reach this page. This should contain at
 * least the Job Id.
 *
 * @param {string} params.id - The id of the Job being worked
 * on. Job.id is a UUID string.
 */
class BagUploadController extends RunningJobsController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = new Job();
        this.form = null;
        this.tempFile = "";
    }

    /**
     * This displays a form where users can choose a bag and
     * a profile.
     */
    show() {
        this.form = new BagUploadForm(this.job);
        let data = {
            job: this.job,
            form: this.form
        }
        let html = Templates.bagUploadForm(data);
        return this.containerContent(html);
    }

    uploadBag() {
        this._startUploadJob()
        this._initResultsDiv()
        this._attachEvents()
    }

    _startUploadJob() {
        this.form.parseFromDOM();
        let job = this.job = this.form.obj;
        this.tempFile = Util.tmpFilePath();
        fs.writeFileSync(this.tempFile, JSON.stringify(job));
        let modulePath = path.join(__dirname, '..', '..', 'main.js');
        this.childProcess = fork(
                modulePath,
                ['--job', this.tempFile]
        );
        this.dartProcess = new DartProcess(
            this.job.title,
            this.job.id,
            this.childProcess
        );
        Context.childProcesses[this.dartProcess.id] = this.dartProcess;
    }

    _initResultsDiv() {
        // this.completedUploads is part of super class,
        // RunningJobsController. We need to clear this list,
        // or it will display prior uploads in addition to 
        // the current upload. This issue occurs when user
        // runs multiple consecutive upload jobs without leaving
        // the current page.
        this.completedUploads = [];

        $('#btnUpload').prop('disabled', true);
        let processDiv = $('#dartProcessContainer');
        processDiv.empty();
        let html = Templates.partials['dartProcess']({ item: this.dartProcess });
        processDiv.html(html);
        this.initProgressBar(this.dartProcess, 'uploadInfo');
        $(`#${this.dartProcess.id} div.uploadInfo`).show();
        processDiv.show();
    }

    _attachEvents() {
        let controller = this;
        this.dartProcess.process.on('message', (data) => {
            controller.renderUploadInfo(data, this.dartProcess);
        });

        this.dartProcess.process.on('exit', (code, signal) => {
            Context.logger.info(`Process ${this.dartProcess.process.pid} exited with code ${code}, signal ${signal}`);
            delete Context.childProcesses[this.dartProcess.id];
            controller._renderOutcome(code)
        });
    }

    _renderOutcome(code) {
        let job = Job.find(this.job.id)
        let [detailDiv, progressBar] = this.getDivs(this.dartProcess, 'outcome');
        if (code == 0) {
            this.markSuccess(detailDiv, progressBar, Context.y18n.__('Job completed successfully.'));
        } else {
            let msg = Context.y18n.__('Upload failed.')
            Context.logger.error(msg);
            msg += `<br/>${job.getRunErrors().join("<br/>")}`
            this.markFailed(detailDiv, progressBar, msg.replace(/\n/g, '<br/>'));
        }
        // Button exists on job "Review and Run" page, not dashboard.
        $('#btnUpload').prop('disabled', false);

        // The child process stores a record of the job in the
        // Jobs db. Delete that DB copy, so validation jobs don't
        // cause too much clutter.
        job.delete();

        if (this.tempFile != "" && !Util.isDirectory(this.tempFile)) {
            try {
                console.log("Deleting " + this.tempFile)
                fs.remove(this.tempFile)
            } catch(ex) {
                // ignore
            } finally {
                this.tempFile = null
            }
        }
    }

    postRenderCallback(fnName) {
        let controller = this;
        $('#pathToBag').on('change',function(e){
            let element = document.getElementById('pathToBag');
            if (element && element.files && element.files[0]) {
                var filename = document.getElementById('pathToBag').files[0].path
                // Our form includes attr webkitdirectory on the file input.
                // If user selects a directory, it will have more than one
                // file. If we see that, change filename to the dirname.
                // User could not have manually selected multiple files because
                // we did not set the multiple attribute on the file input.
                if (element.files.length > 1) {
                    filename = path.dirname(filename);
                }
                $(this).next('.custom-file-label').html(filename);
                $('#btnUpload').prop('disabled', false);
                $('#dartProcessContainer').html('');
            }
        })
        $('#bagTypeFile').on('click',function(e){
            let fileInput = $('#pathToBag');
            fileInput.files = [];
            fileInput.removeAttr('webkitdirectory');
            fileInput.attr('accept', '.*');
            $(fileInput).next('.custom-file-label').html(
                Context.y18n.__("Choose a file...")
            );
        })
        $('#bagTypeDirectory').on('click',function(e){
            let fileInput = $('#pathToBag');
            fileInput.files = [];
            fileInput.attr('webkitdirectory', true);
            fileInput.removeAttr('accept');
            $(fileInput).next('.custom-file-label').html(
                Context.y18n.__("Choose a directory...")
            );
        })
        $('#btnUpload').on('click', () => { controller.uploadBag() })
    }

}

module.exports.BagUploadController = BagUploadController;
