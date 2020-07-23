const $ = require('jquery');
const { BatchTestUtil } = require('../../util/batch_test_util');
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

test('new() displays form with workflows and file chooser', () => {
    let controller = new WorkflowBatchController()
    controller.new();
    setTimeout(function() {
        let workflowList = $('#workflowBatchForm_workflowId');
        let options = $("#workflowBatchForm_workflowId option")
        expect(workflowList.length).toEqual(1);
        expect(options.length).toBeGreaterThan(1);
        expect($('#pathToCSVFile').length).toEqual(1);
    }, 500);
});

test('runBatch with missing workflow and batch', () => {
    let controller = new WorkflowBatchController()
    controller.new();
    setTimeout(function() {
        controller.runBatch();
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
    }, 800);
});

test('runBatch with invalid workflow', () => {

});

test('runBatch with missing files', () => {

});

test('runBatch with valid workflow and files', () => {

});
