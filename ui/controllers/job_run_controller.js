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
        let childProcess = spawn(
            "npm",
            ['start', '--', '--job', tmpFile]
        );

        childProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        childProcess.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        childProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        // TODO: Need to wire up events.
        let dartProcess = new DartProcess(
            this.job.title(),
            tmpFile,
            childProcess.pid
        );
        dartProcess.save();
        Context.childProcesses[dartProcess.id] = childProcess;
        let params = new URLSearchParams();
        return this.redirect('DartProcess', 'list', params);
    }

    postRenderCallback(fnName) {

    }
}

module.exports.JobRunController = JobRunController;
