const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BagValidationForm } = require('../forms/bag_validation_form');
const { BaseController } = require('./base_controller');
const { Constants } = require('../../core/constants');
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
 * The BagValidationController presents a page on which users can
 * validate a bag against a BagIt profile.
 *
 * @param {URLSearchParams} params - The URL search params parsed
 * from the URL used to reach this page. This should contain at
 * least the Job Id.
 *
 * @param {string} params.id - The id of the Job being worked
 * on. Job.id is a UUID string.
 */
class BagValidationController extends RunningJobsController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = new Job();
        this.form = null;
    }

    /**
     * This displays a form where users can choose a bag and
     * a profile.
     */
    show() {
        this.form = new BagValidationForm(this.job);
        let data = {
            job: this.job,
            form: this.form
        }
        let html = Templates.bagValidationForm(data);
        return this.containerContent(html);
    }

    validateBag() {
        this._startValidationJob()
        this._initResultsDiv()
        this._attachEvents()
    }

    _startValidationJob() {
        this.form.parseFromDOM();
        let job = this.form.obj;
        let tmpFile = Util.tmpFilePath();
        fs.writeFileSync(tmpFile, JSON.stringify(job));
        let modulePath = path.join(__dirname, '..', '..', 'main.js');
        this.childProcess = fork(
                modulePath,
                ['--job', tmpFile]
        );
        this.dartProcess = new DartProcess(
            this.job.title,
            this.job.id,
            this.childProcess
        );
        Context.childProcesses[this.dartProcess.id] = this.dartProcess;
    }

    _initResultsDiv() {
        $('#btnValidate').prop('disabled', true);
        let processDiv = $('#dartProcessContainer');
        let html = Templates.partials['dartProcess']({ item: this.dartProcess });
        processDiv.html(html);
        this.initProgressBar(this.dartProcess, 'validationInfo');
        $(`#${this.dartProcess.id} div.validationInfo`).show();
        processDiv.show();
    }

    _attachEvents() {
        let controller = this;
        this.dartProcess.process.on('message', (data) => {
            controller.renderValidationInfo(data, this.dartProcess);
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
            let msg = Context.y18n.__('The bag is not valid according to the selected profile.')
            Context.logger.error(msg);
            msg += `<br/>${job.getRunErrors().join("<br/>")}`
            this.markFailed(detailDiv, progressBar, msg.replace(/\n/g, '<br/>'));
        }
        // Button exists on job "Review and Run" page, not dashboard.
        $('#btnValidate').prop('disabled', false);

        // The child process stores a record of the job in the
        // Jobs db. Delete that DB copy, so validation jobs don't
        // cause too much clutter.
        job.delete();
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
                $('#btnValidate').prop('disabled', false);
                $('#dartProcessContainer').html('');
            }
        })
        $('#bagTypeFile').on('click',function(e){
            let fileInput = $('#pathToBag');
            fileInput.files = [];
            fileInput.removeAttr('webkitdirectory');
            fileInput.attr('accept', '.tar');
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
        $('#btnValidate').on('click', () => { controller.validateBag() })
    }

}

module.exports.BagValidationController = BagValidationController;
