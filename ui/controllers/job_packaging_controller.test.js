const $ = require('jquery');
const { Job } = require('../../core/job');
const { JobPackagingController } = require('./job_packaging_controller');
const { PackageOperation } = require('../../core/package_operation');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const { Util } = require('../../core/util');

beforeEach(() => {
    TestUtil.deleteJsonFile('Job');
});

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
});

function getJobWithPackageOp() {
    var job = new Job();
    job.packageOp = new PackageOperation('TestBag', '/dev/null');
    job.save();
    return job;
}

test('constructor', () => {
    let job = getJobWithPackageOp();
    let params = new URLSearchParams({ id: job.id});
    let controller = new JobPackagingController(params);
    expect(controller.model).toEqual(Job);
    expect(controller.job.id).toEqual(job.id);
});
