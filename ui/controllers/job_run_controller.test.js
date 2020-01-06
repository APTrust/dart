const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Job } = require('../../core/job');
const { JobRunController } = require('./job_run_controller');
const { PackageOperation } = require('../../core/package_operation');
const path = require('path');
const { StorageService } = require('../../core/storage_service');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const { UploadOperation } = require('../../core/upload_operation');
const { Util } = require('../../core/util');

beforeEach(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('StorageService');
});

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('StorageService');
});

function getStorageService(name, proto, host) {
    let ss = new StorageService({
        name: name,
        protocol: proto,
        host: host
    });
    ss.save();
    return ss;
}

function getUploadOp(name, proto, host) {
    let ss = getStorageService(name, proto, host);
    let op = new UploadOperation();
    op.sourceFiles = ['/dev/null'];
    op.storageServiceId = ss.id;
    return op;
}

function getJob() {
    var job = new Job();
    job.packageOp = new PackageOperation('TestBag', '/dev/null');
    job.packageOp.packageFormat = 'BagIt';
    job.packageOp._trimLeadingPaths = false;
    job.packageOp.sourceFiles = [
        __dirname,
        path.join(__dirname, '..', 'forms')
    ];
    job.dirCount = 2;
    job.fileCount = 12;
    job.byteCount = 237174;
    job.uploadOps = [
        getUploadOp('target1', 's3', 'target1.com'),
        getUploadOp('target2', 's3', 'target2.com')
    ];
    job.bagItProfile = BagItProfile.load(path.join(__dirname, '..', '..', 'test', 'profiles', 'multi_manifest.json'));
    job.save();
    return job;
}

function getController() {
    let job = getJob();
    let params = new URLSearchParams({ id: job.id });
    return new JobRunController(params);
}

test('constructor', () => {
    let controller = getController();
    expect(controller.model).toEqual(Job);
    expect(controller.job).not.toBeNull();
});

test('show', () => {
    let controller = getController();
    let response = controller.show()

    expect(response.container).toMatch(controller.job.packageOp.packageName);
    expect(response.container).toMatch(controller.job.packageOp.outputPath);

    expect(response.container).toMatch(controller.job.bagItProfile.name);
    expect(response.container).toMatch(controller.job.bagItProfile.description);

    expect(response.container).toMatch('2 Directories');
    expect(response.container).toMatch('12 Files');
    expect(response.container).toMatch('231.62 KB');

    expect(response.container).toMatch(controller.job.packageOp.sourceFiles[0]);
    expect(response.container).toMatch(controller.job.packageOp.sourceFiles[1]);
});
