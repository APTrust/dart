const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const { JobParams } = require('../../core/job_params');
const Templates = require('../common/templates');
const { Workflow } = require('../../core/workflow');
const { WorkflowBatch } = require('../../core/workflow_batch');
const { WorkflowForm } = require('../forms/workflow_form');
const { WorkflowBatchForm } = require('../forms/workflow_batch_form');

const typeMap = {
    userCanDelete: 'boolean',  // part of Workflow
    limit: 'number',           // used in list params
    offset: 'number',          // used in list params
}

class WorkflowController extends BaseController {

    constructor(params) {
        super(params, 'Workflows');
        this.typeMap = typeMap;

        this.model = Workflow;
        this.formClass = WorkflowForm;
        this.formTemplate = Templates.workflowForm;
        this.listTemplate = Templates.workflowList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'name';
        this.defaultSortDirection = 'asc';
    }

    /**
     * This creates a new job based on a workflow, then redirects
     * the user to the JobController, where they can set up and run
     * the job.
     *
     */
    createJob() {
        let workflow = Workflow.find(this.params.get('workflowId'));
        let jobParams = new JobParams({
            workflowName: workflow.name
        });
        let job = jobParams.toJob();
        if (job == null) {
            let errMsg = Context.y18n.__('Error creating job from workflow.');
            for (let [key, value] of Object.entries(jobParams.errors)) {
                errMsg += `\n\n${key}: ${value}`
            }
            Context.logger.error(errMsg);
            alert(errMsg);
            return this.noContent();
        }
        job.save();
        this.params.set('id', job.id);
        return this.redirect('JobFiles', 'show', this.params);
    }

    /**
     * This presents a form to create a new {@link Workflow} from a
     * {@link Job}. Most of the fields on the form will be automatically
     * populated.
     *
     */
    newFromJob() {
        let job = Job.find(this.params.get('jobId'));
        let workflow = Workflow.fromJob(job);
        let form = new this.formClass(workflow);
        let html = this.formTemplate({ form: form });
        return this.containerContent(html);
    }

    /**
     * This function shows or hides a list of BagIt profiles, based
     * on whether this job includes a bagging step. For jobs that
     * include bagging, the user must speficy a BagIt profile.
     */
    onFormatChange() {
        return function() {
            var format = $("select[name=packageFormat]").val();
            if (format == 'BagIt') {
                $('#jobProfileContainer').show();
            } else {
                $('#jobProfileContainer').hide();
            }
        }
    }

    /**
     * This presents a view where the user can choose a workflow from a list
     * and can choose a CSV file containing information about files to be
     * bagged. The user can then run all of the items in the CSV file through
     * the selected workflow.
     *
     */
    batch() {
        let batch = new WorkflowBatch();
        let form = new WorkflowBatchForm(batch);
        let html = Templates.workflowBatch({ form: form });
        return this.containerContent(html);
    }

    /**
     *
     *
     */
    runBatch() {

    }

    /**
     * The postRenderCallback attaches event handlers to elements
     * that this controller has just rendered.
     */
    postRenderCallback(fnName) {
        if (fnName == 'newFromJob') {
            $("select[name=packageFormat]").change(this.onFormatChange());
        }
    }

}

module.exports.WorkflowController = WorkflowController;
