const $ = require('jquery');
const { Choice } = require('./choice');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { Util } = require('../../core/util');
const { Workflow } = require('../../core/workflow');

/**
 * WorkflowBatchForm allows the user to run a workflow against a
 * batch of items defined in a CSV file.
 */
class WorkflowBatchForm extends Form {

    constructor(workflowBatch) {
        super('WorkflowBatch', workflowBatch);
        this._init(workflowBatch);
    }

    _init() {
        this._initPathToCSVFile();
        this._initWorkflowList();
    }

    _initPathToCSVFile() {
        this.fields['pathToCSVFile'] = new Field("pathToCSVFile", "pathToCSVFile", "Choose CSV file", "");
        this.fields['pathToCSVFile'].attrs = {
            accept: '.csv',
            required: true,
        }
        this.fields['pathToCSVFile'].error = this.obj.errors['pathToCSVFile'];
    }

    _initWorkflowList() {
        let listOptions = {
            orderBy: 'name',
            sortDirection: 'asc'
        }
        this.fields['workflowId'].label = Context.y18n.__("Choose a workflow");
        this.fields['workflowId'].required = true;
        this.fields['workflowId'].choices = Choice.makeList(
            Workflow.list(null, listOptions),
            this.obj.workflowId,
            true
        );
        this.fields['workflowId'].help = Context.y18n.__("The workflow you choose will be applied to each item in the CSV file.")
    }

    parseFromDOM() {
        super.parseFromDOM();
        let files = document.getElementById('pathToCSVFile').files
        if (files.length > 0) {
            this.obj.pathToCSVFile = files[0].path;
        } else {
            this.obj.pathToCSVFile = '';
        }
    }

}

module.exports.WorkflowBatchForm = WorkflowBatchForm;
