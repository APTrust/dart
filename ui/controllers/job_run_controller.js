const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { DartProcess } = require('../../core/dart_process');
const fs = require('fs');
const { Job } = require('../../core/job');
const { spawn } = require('child_process');
const Templates = require('../common/templates');
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
        Context.childProcesses[dartProcess.id] = childProcess;
        //let params = new URLSearchParams();
        //return this.redirect('DartProcess', 'list', params);
    }

    initRunningJobDisplay(dartProcess, childProcess) {
        let controller = this;
        let html = Templates.partials['dartProcess']({ item: this.dartProcess });
        $('#dartProcessContainer').html(html);
        let element = $(`#${dartProcess.id} p.status`);
        this.childProcess.stdout.on('data', (str) => {
            console.log(`stdout: ${str}`);
            element.text(str);
            controller.renderChildProcOutput(str);
        });

        this.childProcess.stderr.on('data', (str) => {
            console.log(`stderr: ${str}`);
        });

        this.childProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    }

    renderChildProcOutput(str) {
        let data = null;
        try { data = JSON.parse(str) }
        catch { return }
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
        let element = $(`#${dartProcess.id} p.packageInfo`);
    }

    renderValidationInfo(data) {
        let element = $(`#${dartProcess.id} p.validationInfo`);
    }

    renderUploadInfo(data) {
        let element = $(`#${dartProcess.id} p.uploadInfo`);
    }

    postRenderCallback(fnName) {

    }
}

module.exports.JobRunController = JobRunController;
