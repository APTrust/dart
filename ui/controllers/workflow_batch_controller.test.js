const $ = require('jquery');
const { BatchTestUtil } = require('../../util/batch_test_util');
const { Context } = require('../../core/context');
const fs = require('fs');
const path = require('path');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const { WorkflowBatchController } = require('./workflow_batch_controller');
const { AppSetting } = require('../../core/app_setting');

var t = new BatchTestUtil();

beforeAll(() => {
    t.saveGoodAndBadWorkflows();
    t.createBaggingDirectory();
});

afterAll(() => {
    TestUtil.deleteJsonFile('Workflow');
    TestUtil.deleteJsonFile('AppSettings');
    cleanBaggingDir()
});

afterEach(() => {
    if (t.tempCSVFile != '' && fs.existsSync(t.tempCSVFile)) {
        fs.unlinkSync(t.tempCSVFile);
    }
    cleanBaggingDir()
});

function cleanBaggingDir() {
    let dir = AppSetting.firstMatching("name", "Bagging Directory")
    try {
        fs.unlinkSync(path.join(dir.value, "dart-bagit.tar"))
    } catch (ex) {

    }
    try {
        fs.unlinkSync(path.join(dir.value, "dart-core.tar"))
    } catch (ex) {

    }
    try {
        fs.unlinkSync(path.join(dir.value, "dart-migrations.tar"))
    } catch (ex) {
        
    }
}

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
    jest.setTimeout(10000);
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
    }, 1500);
});

test('runBatch with invalid workflow', done => {
    jest.setTimeout(10000);
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
    }, 1500);
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
    }, 2000);
});

test('runBatch with valid workflow and files', done => {

    if (process.env.TRAVIS_OS_NAME) {
        console.log('Skipping workflow batch test because Travis is too slow to run it.')
        done()
        return
    }

    //jest.setTimeout(10000);
    let controller = new WorkflowBatchController()

    // Set file paths in the CSV file to actual existing paths.
    t.fixPaths();

    UITestUtil.setDocumentBody(controller.new());
    setTimeout(function() {
        // Choose a workflow with no name and missing/invalid attributes
        $("#workflowBatchForm_workflowId").val(t.goodWorkflowId)
        controller._injectedCSVFilePath = t.tempCSVFile
        // This action does not return new HTML. It alters the existing DOM.
        controller.runBatch();
    }, 1000);

    // This is where we check the actual results.
    // We need controllers or ui/application.js to emit events
    // so we can stop using setTimeout.
    setTimeout(function() {
        let alertDiv = $('#batchCompleted');
        expect(alertDiv.length).toEqual(1);
        expect(alertDiv.css('display')).toEqual('block');
        expect($(alertDiv).text().trim()).toEqual(Context.y18n.__("All jobs have completed. Check the results below."));

        let resultsDiv = $('#workflowResults');
        expect(resultsDiv.length).toEqual(1);
        expect(resultsDiv.css('display')).toEqual('block');

        // There are three jobs in this batch.
        let specificResults = $('div.row.batch-result');
        expect(specificResults.length).toEqual(3);

        // Results include a green icon for each success
        // and a red icon for each failure. They should all be green.
        // See ui/templates/partials/workflow_job_succeeded.html
        // and ui/templates/partials/workflow_job_failed.html
        let resultsHTML = $(resultsDiv).html();
        expect(resultsHTML).toContain("color: green;");
        expect(resultsHTML).not.toContain("color: red;");

        done();
    }, 7500);
}, 10000);
