const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { DartProcess } = require('../../core/dart_process');
const fs = require('fs');
const { Job } = require('../../core/job');
const { JobRunner } = require('../../workers/job_runner');
const { spawn } = require('child_process');
const Templates = require('../common/templates');
const { UIConstants } = require('../common/ui_constants');
const { UploadTarget } = require('../../core/upload_target');

/**
 * The JobRunController displays the page where users review
 * and run a Job.
 *
 * @param {URLSearchParams} params - The URL search params parsed
 * from the URL used to reach this page. This should contain at
 * least the Job Id.
 *
 * @param {string} params.id - The id of the Job being worked
 * on. Job.id is a UUID string.
 */
class JobRunController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = Job.find(this.params.get('id'));
        this.dartProcess = null;
        this.childProcess = null;
    }

    /**
     * Displays a summary of the Job and the "Run Job" button.
     */
    show() {
        let uploadTargets = [];
        for (let op of this.job.uploadOps) {
            let target = UploadTarget.find(op.uploadTargetId);
            if (target) {
                uploadTargets.push(target.name);
            }
        }
        let data = { job: this.job, uploadTargets: uploadTargets }
        return this.containerContent(Templates.jobRun(data));
    }

    /**
     * Runs the Job in a separate process.
     */
    run() {
        // Grey this out while job is running.
        // Run job in separate process, so user can
        // navigate to other screens without disrupting it.
        let tmpFile = '/Users/apd4n/tmp/dart/job.json'
        fs.writeFileSync(tmpFile, JSON.stringify(this.job));

        // Need to change npm command outside of dev env.
        this.childProcess = spawn(
            "npm",
            ['start', '--', '--job', tmpFile]
        );
        this.dartProcess = new DartProcess(
            this.job.title(),
            tmpFile,
            this.childProcess.pid
        );
        this.dartProcess.save();
        this.initRunningJobDisplay();
        Context.childProcesses[this.dartProcess.id] = this.childProcess;
        //let params = new URLSearchParams();
        //return this.redirect('DartProcess', 'list', params);
        return this.noContent();
    }

    initRunningJobDisplay(dartProcess, childProcess) {
        this.showDivs();
        let controller = this;
        let capturedErrorOutput = [];

        this.childProcess.stdout.on('data', (str) => {
            console.log(`${str}`);
            controller.renderChildProcOutput(str);
        });

        this.childProcess.stderr.on('data', (str) => {
            capturedErrorOutput.push(str);
        });

        this.childProcess.on('close', (code) => {
            this.dartProcess.completedAt = new Date().toISOString();
            this.dartProcess.exitCode = code;
            if (capturedErrorOutput.length > 0) {
                this.dartProcess.capturedOutput = capturedErrorOutput.join("\n");
            }
            this.renderOutcome(code);
            // TODO: Optionally delete bag file/folder
        });
    }

    showDivs() {
        let processDiv = $('#dartProcessContainer');
        let html = Templates.partials['dartProcess']({ item: this.dartProcess });
        processDiv.html(html);
        if (this.job.packageOp && this.job.packageOp.outputPath) {
            $(`#${this.dartProcess.id} div.packageInfo`).show();
            if (this.job.packageOp.packageFormat == 'BagIt') {
                $(`#${this.dartProcess.id} div.validationInfo`).show();
            }
        }
        if (this.job.uploadOps.length > 0) {
            $(`#${this.dartProcess.id} div.uploadInfo`).show();
        }
        processDiv.show();
    }

    renderChildProcOutput(str) {
        let data = null;
        try { data = JSON.parse(str) }
        catch (ex) { return }
        switch (data.op) {
        case 'package':
            this.renderPackageInfo(data);
            break;
        case 'validate':
            this.renderValidationInfo(data);
            break;
        case 'upload':
            this.renderUploadInfo(data);
            break;
        default:
            return;
        }
    }

    renderPackageInfo(data) {
        let detailDiv = $(`#${this.dartProcess.id} div.packageInfo div.detail`);
        let iconDiv = $(`#${this.dartProcess.id} div.packageInfo div.resultIcon`);
        if (data.action == 'fileAdded') {
            detailDiv.text(Context.y18n.__('Added file %s', data.msg));
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                this.markSuccess(detailDiv, iconDiv, data.msg);
            } else {
                this.markFailed(detailDiv, iconDiv, data.msg);
            }
        } else {
            detailDiv.text(data.msg);
        }
    }

    renderValidationInfo(data) {
        let detailDiv = $(`#${this.dartProcess.id} div.validationInfo div.detail`);
        let iconDiv = $(`#${this.dartProcess.id} div.validationInfo div.resultIcon`);
        if (data.action == 'checksum') {
            detailDiv.text(Context.y18n.__('Validating %s', data.msg));
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                this.markSuccess(detailDiv, iconDiv, data.msg);
            } else {
                this.markFailed(detailDiv, iconDiv, data.msg);
            }
        }
    }

    renderUploadInfo(data) {
        let detailDiv = $(`#${this.dartProcess.id} div.uploadInfo div.detail`);
        let iconDiv = $(`#${this.dartProcess.id} div.uploadInfo div.resultIcon`);
        let completed = [];
        if (data.action == 'start') {
            detailDiv.text(data.msg);
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                completed.push(data.msg);
                this.markSuccess(detailDiv, iconDiv, completed.join("<br/>\n"));
            } else {
                this.markFailed(detailDiv, iconDiv, data.errors.join("<br/>\n"));
            }
        }
    }

    renderOutcome(code) {
        // We have to reload this, because the child process updated
        // the job's record in the database.
        this.job = Job.find(this.job.id);
        let detailDiv = $(`#${this.dartProcess.id} div.outcome div.detail`);
        let iconDiv = $(`#${this.dartProcess.id} div.outcome div.resultIcon`);
        if (code == 0) {
            this.markSuccess(detailDiv, iconDiv, Context.y18n.__('Job completed successfully.'));
        } else {
            this.markFailed(detailDiv, iconDiv, Context.y18n.__('Job did not complete due to errors.') + "<br/>" + this.dartProcess.capturedOutput);
        }
    }

    markSuccess(detailDiv, iconDiv, message) {
        detailDiv.html(message);
        iconDiv.html(UIConstants.GREEN_SMILEY);
    }

    markFailed(detailDiv, iconDiv, message) {
        detailDiv.html(message);
        iconDiv.html(UIConstants.RED_ANGRY_FACE);
    }

    postRenderCallback(fnName) {

    }
}

module.exports.JobRunController = JobRunController;
