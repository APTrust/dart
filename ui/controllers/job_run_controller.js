const $ = require('jquery');
const { Context } = require('../../core/context');
const fs = require('fs');
const { Job } = require('../../core/job');
const { RunningJobsController } = require('./running_jobs_controller');
const Templates = require('../common/templates');
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
        // Reset these flags each time we load the page
        this.job.skipPackaging = false
        this.job.skipValidation = false

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
            trimPath: this._getTrimPath(),
            workflowName: this.job.workflowName
        }
        return this.containerContent(Templates.jobRun(data));
    }

    /**
     * 
     * Determines how to run the job and runs it, if appropriate.
     * 
     * @returns {Object} An empty object.
     */
    run() {
        let rerunModal = this._checkForRerun()
        if (rerunModal) {
            return rerunModal
        }
        return this.runJob()
    }

    /**
     * Runs the Job in a separate process.
     * 
     * @returns {Object} An empty object.
     * 
     * */
    runJob() {
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
     * If the bag exists from a prior run, ask the user if they want to 
     * run the entire job again or just upload the existing bag.
     */
    _checkForRerun() {
        if (this.job.packageOp && fs.existsSync(this.job.packageOp.outputPath)) {
            let data = {
                job: this.job
            }
            let html = Templates.jobRerunModal(data);
            return this.modalContent('Bag Exists', html);    
        } else {
            return null
        }
    }

    _getTrimPath() {
        let trimPath = '';
        if (this.job.packageOp && this.job.packageOp.trimLeadingPaths()) {
            trimPath = Util.findCommonPathPrefix(this.job.packageOp.sourceFiles);
        }
        return trimPath;
    }

    postRenderCallback(fnName) {
        let controller = this
        if(fnName == 'run') {
            let btnRerun = document.getElementById('btnRerun')
            if (btnRerun) {
                btnRerun.addEventListener('click', function(e) {
                    console.log("Clicked re-run")
                    if (controller.job.packageOp && Util.isNonEmptyDirectory(controller.job.packageOp.outputPath)) {
                        Util.deleteRecursive(controller.job.packageOp.outputPath)
                    }
                    controller.runJob()
                })
            }
            let btnUploadOnly = document.getElementById('btnUploadOnly')
            if (btnUploadOnly) {
                btnUploadOnly.addEventListener('click', function(e) {
                    controller.job.skipPackaging = true
                    controller.job.skipValidation = true
                    controller.job.save()
                    controller.runJob()                        
                })
            }
        }
    }
}

module.exports.JobRunController = JobRunController;
