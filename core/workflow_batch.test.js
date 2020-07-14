const { Constants } = require('./constants');
const path = require('path');
const { TestUtil } = require('./test_util');
const { Workflow } = require('./workflow');
const { WorkflowBatch } = require('./workflow_batch');

const WorkflowId = 'abd9a873-c31a-4349-970d-e3abb4d62342';
const CSVFile = path.join(__dirname, '..', 'test', 'fixtures', 'batch_for_testing.csv')
const opts = {
    workflowId: WorkflowId,
    pathToCSVFile: CSVFile,
}


beforeAll(() => {
    TestUtil.loadFromProfilesDir('aptrust_2.2.json').save();
    let workflow = new Workflow({
        name: 'CSV Test Workflow',
        packageFormat: 'BagIt',
        packagePluginId: 'BagIt',
        bagItProfileId: Constants.BUILTIN_PROFILE_IDS['aptrust'],
    });
    workflow.id = WorkflowId
    workflow.save();
});

afterAll(() => {
    TestUtil.deleteJsonFile('Workflow');
});

test('Constructor sets expected properties', () => {
    let batch = new WorkflowBatch(opts);
    expect(batch.workflowId).toEqual(opts.workflowId);
    expect(batch.pathToCSVFile).toEqual(opts.pathToCSVFile);
});
