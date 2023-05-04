const $ = require('jquery');
//const { BagItProfile } = require('../../bagit/bagit_profile');
//const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
//const { DartProcess } = require('../../core/dart_process');
//const { fork } = require('child_process');
//const fs = require('fs');
const { Job } = require('../../core/job');
//const { JobRunner } = require('../../workers/job_runner');
//const path = require('path');
const { RunningJobsController } = require('./running_jobs_controller');
const Templates = require('../common/templates');
//const { UIConstants } = require('../common/ui_constants');
const { StorageService } = require('../../core/storage_service');
const { Util } = require('../../core/util');

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
class JobRunController extends RunningJobsController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = Job;
        this.job = Job.find(this.params.get('id'));
        this.dartProcess = null;
        this.childProcess = null;
        this.reachedEndOfOutput = false;
    }

    /**
     * Displays a summary of the Job and the "Run Job" button.
     */
    show() {
        let uploadTargets = [];
        for (let op of this.job.uploadOps) {
            let target = StorageService.find(op.storageServiceId);
            if (target) {
                uploadTargets.push(target.name);
            }
        }
        let data = {
            job: this.job,
            uploadTargets: uploadTargets,
            trimPath: this._getTrimPath()
        }
        return this.containerContent(Templates.jobRun(data));
    }

    /**
     * Runs the Job in a separate process.
     */
    run() {
        if (!this._checkOutputPath()) {
            return this.noContent()
        }
        let proc = Util.forkJobProcess(this.job);
        this.childProcess = proc.childProcess;
        this.dartProcess = proc.dartProcess;
        this.initRunningJobDisplay(this.dartProcess);
        Context.childProcesses[this.dartProcess.id] = this.dartProcess;
        $('#btnRunJob').prop('disabled', true);
        return this.noContent();
    }

    /**
     * This handles the page's Back button click.
     */
    back() {
        let prevController = 'JobUpload';
        // If we have a workflow id, the uploads for this job
        // are already determined, so we can skip that screen.
        if (this.job.workflowId) {
            prevController = 'JobMetadata';
        }
        return this.redirect(prevController, 'show', this.params);
    }

    /**
     * If the output path is a non-empty directory, prompt the user to
     * delete it. We call this before running a job.
     */
    _checkOutputPath() {
        let okToRunJob = true
        if (this.job.packageOp && Util.isNonEmptyDirectory(this.job.packageOp.outputPath)) {
            let okToDelete = confirm(Context.y18n.__("You must delete the non-empty directory already at %s before running this job. Click OK to delete it or Cancel to stop.", this.job.packageOp.outputPath))
            if (okToDelete) {
                // Note that this will throw an exception if outputPath is
                // something like "/" or "C:\Users"
                Util.deleteRecursive(this.job.packageOp.outputPath)
            } else {
                okToRunJob = false
            }
        }
        return okToRunJob
    }

    _getTrimPath() {
        let trimPath = '';
        if (this.job.packageOp && this.job.packageOp.trimLeadingPaths()) {
            trimPath = Util.findCommonPathPrefix(this.job.packageOp.sourceFiles);
        }
        return trimPath;
    }

    postRenderCallback(fnName) {

    }
}

module.exports.JobRunController = JobRunController;
