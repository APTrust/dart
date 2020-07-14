const { Constants } = require('./constants');
const { Context } = require('./context');
const path = require('path');
const { TestUtil } = require('./test_util');
const { Workflow } = require('./workflow');
const { WorkflowBatch } = require('./workflow_batch');

const BadWorkflowId = '067eeeba-7192-41cc-a1fb-fdd210bdb826';
const GoodWorkflowId = 'abd9a873-c31a-4349-970d-e3abb4d62342';
const CSVFile = path.join(__dirname, '..', 'test', 'fixtures', 'batch_for_testing.csv')
const opts = {
    workflowId: GoodWorkflowId,
    pathToCSVFile: CSVFile,
}

beforeAll(() => {
    let badWorkflow = new Workflow();
    badWorkflow.id = BadWorkflowId;
    badWorkflow.save();

    TestUtil.loadFromProfilesDir('aptrust_2.2.json').save();
    let goodWorkflow = new Workflow({
        name: 'CSV Test Workflow',
        packageFormat: 'BagIt',
        packagePluginId: 'BagIt',
        bagItProfileId: Constants.BUILTIN_PROFILE_IDS['aptrust'],
    });
    goodWorkflow.id = GoodWorkflowId
    goodWorkflow.save();
});

afterAll(() => {
    TestUtil.deleteJsonFile('Workflow');
});

test('Constructor sets expected properties', () => {
    let batch = new WorkflowBatch(opts);
    expect(batch.workflowId).toEqual(opts.workflowId);
    expect(batch.pathToCSVFile).toEqual(opts.pathToCSVFile);
});

test('validateWorkflow', () => {
    let batch = new WorkflowBatch(opts);
    expect(batch.validateWorkflow()).toEqual(true);

    batch.workflowId = BadWorkflowId;
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
