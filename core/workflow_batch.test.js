const { BatchTestUtil } = require('../util/batch_test_util');
const { Constants } = require('./constants');
const { Context } = require('./context');
const fs = require('fs');
const { TestUtil } = require('./test_util');
const { WorkflowBatch } = require('./workflow_batch');

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

test('Constructor sets expected properties', () => {
    let batch = new WorkflowBatch(t.batchOpts);
    expect(batch.workflowId).toEqual(t.batchOpts.workflowId);
    expect(batch.pathToCSVFile).toEqual(t.batchOpts.pathToCSVFile);
});

test('validateWorkflow()', () => {
    let batch = new WorkflowBatch(t.batchOpts);
    expect(batch.validateWorkflow()).toEqual(true);

    batch.workflowId = t.noNameWorkflowId;
    expect(batch.validateWorkflow()).toEqual(false);
    expect(batch.errors).toEqual({
        'name': Context.y18n.__('Name cannot be empty.'),
        'workflow': Context.y18n.__('Workflow has missing or invalid attributes'),
    });

    // Random UUID that does not exist.
    batch.workflowId = '791ace13-2610-411b-8a09-f5856ce7cfce';
    expect(batch.validateWorkflow()).toEqual(false);
    expect(batch.errors).toEqual({
        'name': Context.y18n.__('Name cannot be empty.'),
        'workflow': Context.y18n.__("DART cannot find the workflow you want to run."),
    });
});

test('validateCSVFile() with good paths', () => {
    // Fix paths in CSV file to point to DART source dir
    t.fixPaths();
    let batch = new WorkflowBatch({
        workflowId: t.goodWorkflowId,
        pathToCSVFile: t.tempCSVFile,
    });
    expect(batch.validateCSVFile()).toEqual(true);
    expect(batch.errors).toEqual({});
});


test('validateCSVFile() with bad Access tag values', () => {
    // Replace Access tag values with invalid values.
    t.breakTags(true);
    let batch = new WorkflowBatch({
        workflowId: t.goodWorkflowId,
        pathToCSVFile: t.tempCSVFile,
    });

    let expected =     {
      '2-aptrust-info.txt/Access': 'Value xyz for tag Access on line 2 is not in the list of allowed values.',
      '3-aptrust-info.txt/Access': 'Value xyz for tag Access on line 3 is not in the list of allowed values.',
      '4-aptrust-info.txt/Access': 'Value xyz for tag Access on line 4 is not in the list of allowed values.'
    }

    expect(batch.validateCSVFile()).toEqual(false);
    expect(batch.errors).toEqual(expected);
});


test('validateCSVFile() with bad paths', () => {
    let expectedErrors =     {
        "/home/dev/dart/bagit": "Line 2: path does not exist: /home/dev/dart/bagit",
        "/home/dev/dart/core": "Line 3: path does not exist: /home/dev/dart/core",
        "/home/dev/dart/migrations": "Line 4: path does not exist: /home/dev/dart/migrations"
    }
    let batch = new WorkflowBatch(t.batchOpts);
    expect(batch.validateCSVFile()).toEqual(false);
    expect(batch.errors).toEqual(expectedErrors);
});

test('validate() good', () => {
    t.fixPaths();
    let batch = new WorkflowBatch({
        workflowId: t.goodWorkflowId,
        pathToCSVFile: t.tempCSVFile,
    });
    expect(batch.validate()).toEqual(true);
    expect(Object.keys(batch.errors).length).toEqual(0);
});

test('validate() bad', () => {
    t.breakTags(false);
    let batch = new WorkflowBatch({
        workflowId: t.goodWorkflowId,
        pathToCSVFile: t.tempCSVFile,
    });

    // Should get 3 bad tag value errors and 3 bad paths
    expect(batch.validate()).toEqual(false);
    expect(Object.keys(batch.errors).length).toEqual(6);
});
