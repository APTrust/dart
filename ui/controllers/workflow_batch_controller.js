const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
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
    async runBatch() {
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
        // For clarity, so we remember what type of object we're dealing with.
        let workflowBatch = form.obj;
        for (let jobParams of workflowBatch.jobParamsArray) {
            let exitCode = await this.runJob(jobParams);
        }
        return this.noContent();
    }


    runJob(jobParams) {
        return new Promise((resolve, reject) => {
            let job = jobParams.toJob();
            // validate job?
            console.log(jobParams);
            console.log(job);
            job.save();
            let proc = Util.forkJobProcess(job);
            this.initRunningJobDisplay(proc.dartProcess);
            Context.childProcesses[proc.dartProcess.id] = proc.dartProcess;
            proc.dartProcess.process.on('exit', (code, signal) => {
                // No need to handle resolve/reject conditions.
                // RunningJobsController.initRunningJobsDisplay
                // handles that.
                resolve(code);
            });
        });
    }


    /**
     * The postRenderCallback attaches event handlers to elements
     * that this controller has just rendered.
     */
    postRenderCallback(fnName) {

    }

}

module.exports.WorkflowBatchController = WorkflowBatchController;
