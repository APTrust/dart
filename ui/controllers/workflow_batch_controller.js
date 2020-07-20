const { BaseController } = require('./base_controller');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const fs = require('fs');
const { Job } = require('../../core/job');
const { JobParams } = require('../../core/job_params');
const { RunningJobsController } = require('./running_jobs_controller');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');
const { Workflow } = require('../../core/workflow');
const { WorkflowBatch } = require('../../core/workflow_batch');
const { WorkflowForm } = require('../forms/workflow_form');
const { WorkflowBatchForm } = require('../forms/workflow_batch_form');

class WorkflowBatchController extends RunningJobsController {

    constructor(params) {
        super(params, 'Workflows');
        this.typeMap = {};

        this.model = WorkflowBatch;
        this.formClass = WorkflowBatchForm;
        this.formTemplate = Templates.workflowBatch;
        this.listTemplate = Templates.workflowList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'name';
        this.defaultSortDirection = 'asc';
    }


    /**
     * Validate the batch and run it.
     *
     */
    runBatch() {
        let form = new WorkflowBatchForm(new WorkflowBatch());
        form.parseFromDOM();
        if (!form.obj.validate()) {
            form.setErrors();
            let html = Templates.workflowBatch({
                form: form,
                batchErrors: Object.values(form.obj.errors),
            });
            return this.containerContent(html);
        }
        // form.obj is a WorkflowBatch
        this._runBatchAsync(form.obj);
        return this.noContent();
    }

    async _runBatchAsync(workflowBatch) {
        for (let i = 0; i < workflowBatch.jobParamsArray.length; i++) {
            let jobParams = workflowBatch.jobParamsArray[i];
            let exitCode = await this.runJob(jobParams, i + 1);
        }
    }

    runJob(jobParams, lineNumber) {
        return new Promise((resolve, reject) => {
            let job = jobParams.toJob();
            // validate job?
            job.save();
            let proc = Util.forkJobProcess(job);
            $('#dartProcessContainer').html(Templates.dartProcess({ item: proc.dartProcess }));
            this.initRunningJobDisplay(proc.dartProcess);
            Context.childProcesses[proc.dartProcess.id] = proc.dartProcess;
            proc.dartProcess.process.on('exit', (code, signal) => {
                // No need to handle resolve/reject conditions.
                // RunningJobsController.initRunningJobsDisplay
                // handles that.
                if (code != Constants.EXIT_SUCCESS) {
                    this._showJobFailed(job, proc.dartProcess.name, lineNumber);
                } else {
                    this._showJobSucceeded(job, proc.dartProcess.name, lineNumber);
                }
                if (fs.existsSync(job.packageOp.outputPath) && fs.lstatSync(job.packageOp.outputPath).isFile()) {
                    fs.unlinkSync(job.packageOp.outputPath);
                }
                job.delete();
                resolve(code);
            });
        });
    }

    _showJobSucceeded(job, jobName, lineNumber) {
        Context.logger.info(`${job.name} Succeeded`)
        $('#workflowResults').append(Templates.workflowJobSucceeded({
            job: job,
            jobName: jobName,
            lineNumber: lineNumber,
        }));
    }

    _showJobFailed(job, jobName, lineNumber) {
        Context.logger.error(`${job.name} exited with ${code}. Errors: ${JSON.stringify(job.errors)}`)
        $('#workflowResults').append(Templates.workflowJobFailed({
            job: job,
            jobName: jobName,
            lineNumber: lineNumber,
        }));
    }

    /**
     * The postRenderCallback attaches event handlers to elements
     * that this controller has just rendered.
     */
    postRenderCallback(fnName) {

    }

}

module.exports.WorkflowBatchController = WorkflowBatchController;
