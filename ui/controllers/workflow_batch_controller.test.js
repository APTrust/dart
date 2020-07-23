const $ = require('jquery');
const { BatchTestUtil } = require('../../util/batch_test_util');
const { Context } = require('../../core/context');
const { WorkflowBatch } = require('../../core/workflow_batch');
const { WorkflowBatchController } = require('./workflow_batch_controller');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');

var t = new BatchTestUtil();

beforeAll(() => {
    t.saveGoodAndBadWorkflows()
});

afterAll(() => {
    TestUtil.deleteJsonFile('Workflow');
});

afterEach(() => {
    if (t.tempCSVFile != '' && fs.existsSync(t.tempCSVFile)) {
        fs.unlinkSync(t.tempCSVFile);
    }
});

test('new() displays form with workflows and file chooser', done => {
    let controller = new WorkflowBatchController()
    UITestUtil.setDocumentBody(controller.new());
    setTimeout(function() {
        let workflowList = $('#workflowBatchForm_workflowId');
        let options = $("#workflowBatchForm_workflowId option")
        expect(workflowList.length).toEqual(1);
        expect(options.length).toBeGreaterThan(1);
        expect($('#pathToCSVFile').length).toEqual(1);
        done();
    }, 500);
});

test('runBatch with missing workflow and batch', done => {
    let controller = new WorkflowBatchController()
    UITestUtil.setDocumentBody(controller.new());
    setTimeout(function() {
        UITestUtil.setDocumentBody(controller.runBatch());
    }, 500);
    setTimeout(function() {
        let div = $('#batchValidation');
        expect(div.length).toEqual(1);
        expect(div.css('display')).toEqual('block');

        // Errors are as follows, but may be translated.
        //
        // Workflow Id cannot be empty.
        // Path To C S V File cannot be empty.
        // DART cannot find the workflow you want to run.
        let errors = $('#batchValidation ul li');
        expect(errors.length).toEqual(3);
        done();
    }, 1000);
});

test('runBatch with invalid workflow', done => {
    let expected = [
	    'Line 2: path does not exist: /home/dev/dart/bagit',
	    'Line 3: path does not exist: /home/dev/dart/core',
	    'Line 4: path does not exist: /home/dev/dart/migrations',
	    Context.y18n.__("Cannot find BagIt profile for workflow '%s'", 'Invalid Workflow for Batch Testing'),
];
    let controller = new WorkflowBatchController()
    UITestUtil.setDocumentBody(controller.new());
    setTimeout(function() {
        // Choose a workflow with no name and missing/invalid attributes
        $("#workflowBatchForm_workflowId").val(t.emptyWorkflowId)
        controller._injectedCSVFilePath = t.csvFile
        UITestUtil.setDocumentBody(controller.runBatch());
    }, 500);
    setTimeout(function() {
        let div = $('#batchValidation');
        expect(div.length).toEqual(1);
        expect(div.css('display')).toEqual('block');
        let errors = $('#batchValidation ul li');
        expect(errors.length).toEqual(expected.length);
        for (let i=0; i < errors.length; i++) {
            let actualMsg = $(errors[i]).text();
            let expectedMsg = expected[i];
            expect(actualMsg).toEqual(expectedMsg);
        }
        done();
    }, 1000);
});

test('runBatch with missing files', () => {

});

test('runBatch with valid workflow and files', () => {

});
