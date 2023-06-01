const $ = require('jquery');
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

/**
 * WorkflowBatchController runs a workflow against a batch of files
 * listed in a CSV file. See
 * https://aptrust.github.io/dart-docs/users/workflows/batch_jobs/
 * for more information.
 *
 * Note that this controller descends from RunningJobsController,
 * which handles the display of running job progress.
 *
 */
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

        // This is for unit tests only, since browsers will not
        // let us programmatically set value of a file input.
        this._injectesCSVFilePath = null;
    }


    /**
     * Validate the batch and run it.
     *
     */
    runBatch() {
        this._resetDisplayBeforeValidation();
        let form = new WorkflowBatchForm(new WorkflowBatch());
        form.parseFromDOM();
        if (this._injectedCSVFilePath) {
            // For testing. See note above.
            form.obj.pathToCSVFile = this._injectedCSVFilePath;
        }
        if (!form.obj.validate()) {
            form.setErrors();
            let html = Templates.workflowBatch({
                form: form,
                batchErrors: Object.values(form.obj.errors),
            });
            return this.containerContent(html);
        }
        this._resetDisplayBeforeRunning();
        this._clearErrorMessages();
        this._runBatchAsync(form.obj);
        return this.noContent();
    }

    /**
     * Runs each job, one at a time.
     *
     * @param {WorkflowBatch} workflowBatch
     *
     * @private
     */
    async _runBatchAsync(workflowBatch) {
        let lastJobNumber = workflowBatch.jobParamsArray.length;
        for (let i = 0; i < workflowBatch.jobParamsArray.length; i++) {
            let jobParams = workflowBatch.jobParamsArray[i];
            let exitCode = await this.runJob(jobParams, i + 1, lastJobNumber);
        }
    }

    /**
     * Runs a single job from the batch in a separate process and wire up
     * the dartProcess display to track the progress of the external process.
     *
     * @param {JobParams} jobParams - Describes the job to run.
     *
     * @param {number} lineNumber - The line number from the CSV file
     * that describes this job.
     *
     * @param {number} lastJobNumber - The number of the last line
     * of the CSV file. The function uses this to know when it has completed
     * the last job in the batch.
     *
     */
    runJob(jobParams, lineNumber, lastJobNumber) {
        let controller = this;
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
                job = Job.find(job.id);
                let data = {
                    code: code,
                    jobId: job.id,
                    jobName: proc.dartProcess.name,
                    lineNumber: lineNumber,
                    errors: job.getRunErrors(),
                }
                if (code != Constants.EXIT_SUCCESS) {
                    this._showJobFailed(data);
                } else {
                    this._showJobSucceeded(data);
                }
                let bagPath = job.packageOp.outputPath;
                if (fs.existsSync(bagPath) && fs.lstatSync(bagPath).isFile() && job.uploadOps.length > 0) {
                    fs.unlinkSync(bagPath);
                }
                job.delete();
                if (lineNumber == lastJobNumber) {
                    controller._showCompleted();
                }
                resolve(code);
            });
        });
    }

    /**
     * Display a message saying all jobs in the batch have completed.
     *
     * @private
     */
    _showCompleted() {
        $('#batchRunning').hide();
        $('#batchCompleted').show();
    }

    /**
     * Clear any old validation messages from the display before running
     * validation.
     *
     * @private
     */
    _resetDisplayBeforeValidation() {
        $('#batchRunning').hide();
        $('#batchCompleted').hide();
        $('#workflowResults').hide();
    }

    /**
     * Clear any old results from the display before running the batch job.
     *
     * @private
     */
    _resetDisplayBeforeRunning() {
        $('#batchRunning').show();
        $('#workflowResults').show();
        $('div.batch-result').remove();
    }

    /**
     * Clear error messages from the display.
     * If form is invalid at first, then user fixes the problems and
     * clicks Run again, the error messages will remain until we
     * explicitly clear them.
     *
     * @private
     */
    _clearErrorMessages() {
        $('#batchValidation').html('');
        $('small.form-text.text-danger').text('');
    }

    /**
     * Display a message saying a single job from the batch has succeeded.
     *
     * @private
     */
    _showJobSucceeded(data) {
        Context.logger.info(`${data.jobName} Succeeded`)
        $('#workflowResults').append(Templates.workflowJobSucceeded(data));
    }

    /**
     * Display a message saying a single job from the batch has failed.
     *
     * @private
     */
    _showJobFailed(data) {
        Context.logger.error(`${data.jobName} exited with ${data.code}. Errors: ${JSON.stringify(data.errors)}`)
        $('#workflowResults').append(Templates.workflowJobFailed(data));
    }

    /**
     * The postRenderCallback attaches event handlers to elements
     * that this controller has just rendered. In this case,
     * our file input does not replace the placeholder text with the
     * path to the selected file. We have to do that ourselves.
     */
    postRenderCallback(fnName) {
        $('#pathToCSVFile').on('change',function(e){
            let element = document.getElementById('pathToCSVFile');
            if (element && element.files && element.files[0]) {
                var filename = document.getElementById('pathToCSVFile').files[0].path
                $(this).next('.custom-file-label').html(filename);
            }
        });
    }

}

module.exports.WorkflowBatchController = WorkflowBatchController;
