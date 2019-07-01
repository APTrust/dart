const { BaseController } = require('./base_controller');
const { Job } = require('../../core/job');
const Templates = require('../common/templates');
const { Workflow } = require('../../core/workflow');
const { WorkflowForm } = require('../forms/workflow_form');

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
     * The postRenderCallback attaches event handlers to elements
     * that this controller has just rendered.
     */
    postRenderCallback(fnName) {
        $("select[name=packageFormat]").change(this.onFormatChange());
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

}

module.exports.WorkflowController = WorkflowController;
