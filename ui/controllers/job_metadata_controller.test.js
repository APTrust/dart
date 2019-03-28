const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Job } = require('../../core/job');
const { JobMetadataController } = require('./job_metadata_controller');
const { PackageOperation } = require('../../core/package_operation');
const path = require('path');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const { Util } = require('../../core/util');

beforeEach(() => {
    TestUtil.deleteJsonFile('Job');
});

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
});

function getJobWithProfile() {
    var job = new Job();
    job.packageOp = new PackageOperation('TestBag', '/dev/null');
    var profilesDir = path.join(__dirname, '..', '..', 'test', 'profiles');
    job.bagItProfile = BagItProfile.load(path.join(profilesDir, 'multi_manifest.json'));
    job.save();
    return job;
}

test('constructor', () => {
    let job = getJobWithProfile();
    let params = new URLSearchParams({ id: job.id });
    let controller = new JobMetadataController(params);
    expect(controller.job).not.toBeNull();
    expect(controller.job.id).toEqual(job.id);
});

test('show', () => {
    let job = getJobWithProfile();
    let params = new URLSearchParams({ id: job.id });
    let controller = new JobMetadataController(params);
    UITestUtil.setDocumentBody(controller.show())

    // Make sure form includes fields for each tag.
    for (let tag of job.bagItProfile.tags) {
        expect($(`#${tag.id}`).length).toEqual(1);
    }
});
