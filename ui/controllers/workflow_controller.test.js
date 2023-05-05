const { Job } = require('../../core/job');
const path = require('path');
const { TestUtil } = require('../../core/test_util');
const url = require('url');
const { Workflow } = require('../../core/workflow');
const { WorkflowController } = require('./workflow_controller');


beforeAll(() => {
    new Workflow({ name: 'Test Workflow for Controller'}).save();
});

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('Workflow');
});

function getParams() {
    let workflow = Workflow.firstMatching('name', 'Test Workflow for Controller');
    return new url.URLSearchParams({
        workflowId: workflow.id
    });
}

test('Constructor sets expected properties', () => {
    let params = getParams();
    let controller = new WorkflowController(params);
    expect(controller.params).toEqual(params);
    expect(controller.navSection).toEqual("Workflows");

});

test('createJob() creates a new job', () => {
    let params = getParams();
    let controller = new WorkflowController(params);
    let _ = controller.createJob();
    let jobId = controller.params.get('id');
    expect(jobId).toBeDefined();
    let job = Job.find(jobId);
    expect(job).not.toBeNull();
    expect(job.workflowId).toEqual(controller.params.get('workflowId'));
});

test('createJob() redirectors without returning content', () => {
    let params = getParams();
    let controller = new WorkflowController(params);
    let response = controller.createJob();
    expect(response).toEqual({}); // empty object
    expect(controller.redirected).toBe(true);

    let jobId = controller.params.get('id');
    let workflowId = controller.params.get('workflowId');
    expect(window.location.hash).toEqual(`#JobFiles/show?workflowId=${workflowId}&id=${jobId}`);
});

test('newFromJob() shows the Workflow form with correct values', () => {
    let pathToFile = path.join(__dirname, '..', '..', 'test', 'fixtures', 'Job_001.json');
    let job = Job.inflateFromFile(pathToFile);
    job.save();

    let params = new url.URLSearchParams({
        jobId: job.id
    });
    let controller = new WorkflowController(params);

    // The form HTML is in response.container.
    let response = controller.newFromJob();

    // Check that form includes id of new workflow.
    expect(response.container).toMatch(/<input type="hidden" id="workflowForm_id" name="id" value="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"/);

    // Package plugin should be BagIt.
    expect(response.container).toMatch(/<input type="hidden" id="workflowForm_packagePluginId" name="packagePluginId" value="BagIt"/);
});
