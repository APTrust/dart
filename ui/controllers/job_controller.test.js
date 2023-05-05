const { Job } = require('../../core/job');
const { JobController } = require('./job_controller');
const { TestUtil } = require('../../core/test_util');
const { Util } = require('../../core/util');

beforeEach(() => {
    TestUtil.deleteJsonFile('Job');
});

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
});

test('constructor', () => {
    let controller = new JobController(new URLSearchParams());
    expect(controller.model).toEqual(Job);
});

test('new', () => {
    let controller = new JobController(new URLSearchParams());
    let returnValue = controller.new()
    expect(returnValue).toEqual({}); // because it's a redirect

    // This controller should update its params collection
    let id = controller.params.get('id');
    expect(Util.looksLikeUUID(id)).toBe(true);

    // Confirm redirect location
    expect(window.location.href).toEqual(`http://localhost/#JobFiles/show?id=${id}`);

    // Make sure it actually created the job
    let job = Job.find(id);
    expect(job).toBeDefined();
    expect(job).not.toBeNull();
});

test('list', () => {
    let ids = [];
    for (let i = 0; i < 3; i++) {
        let job = new Job();
        job.save();
        ids.push(job.id);
    }
    let controller = new JobController(new URLSearchParams());
    let response = controller.list();
    expect(response.container).toBeDefined();

    // List should include each of the three Jobs created above.
    // Check for links to each Job's files page.
    for (let id of ids) {
        let url = `#JobFiles/show?id=${id}`
        expect(response.container).toMatch(url);
    }
});
