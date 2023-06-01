const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Job } = require('../../core/job');
const { JobUploadController } = require('./job_upload_controller');
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
        host: host,
        allowsUpload: true
    });
    ss.save();
    return ss;
}

function getJob() {
    var job = new Job();
    job.uploadOps = [
        new UploadOperation(),
        new UploadOperation()
    ];
    job.uploadOps[0].storageServiceId = getStorageService('target1', 's3', 'target1.com').id;
    job.uploadOps[1].storageServiceId = getStorageService('target2', 's3', 'target2.com').id;
    job.save();
    return job;
}

function getController() {
    let job = getJob();
    let params = new URLSearchParams({ id: job.id });
    return new JobUploadController(params);
}

function uncheckFirstBox() {
    let cb = $("input[name='uploadTargets']")
    $(cb[0]).prop('checked', false);
}

function testUncheckIsSaved(controller, methodToCall) {
    let secondTargetId = controller.job.uploadOps[1].storageServiceId;
    UITestUtil.setDocumentBody(controller.show());
    uncheckFirstBox();
    if (methodToCall == 'back') {
        controller.back();
    } else if (methodToCall == 'next') {
        controller.next();
    } else {
        throw "Homey don't play that game."
    }
    let job = Job.find(controller.job.id);
    expect(job.uploadOps.length).toEqual(1);
    expect(job.uploadOps[0].storageServiceId).toEqual(secondTargetId);
}

test('constructor', () => {
    let controller = getController();
    expect(controller.model).toEqual(Job);
    expect(controller.job).not.toBeNull();
});

test('show', () => {
    let controller = getController();
    UITestUtil.setDocumentBody(controller.show());

    // Make sure the checksboxes show
    let ops = controller.job.uploadOps;
    let cb = $("input[name='uploadTargets']")
    expect($(cb[0]).val()).toEqual(ops[0].storageServiceId);
    expect($(cb[0]).is(":checked")).toBe(true);
    expect($(cb[1]).val()).toEqual(ops[1].storageServiceId);
    expect($(cb[1]).is(":checked")).toBe(true);

    // Remove one upload op from the job. We should
    // still see two checkboxes, because there are
    // two available upload targets, but only one box
    // will be checked.
    controller.job.uploadOps = controller.job.uploadOps.slice(0,1);
    UITestUtil.setDocumentBody(controller.show());
    ops = controller.job.uploadOps;
    cb = $("input[name='uploadTargets']")
    expect(cb.length).toEqual(2);
    expect($(cb[0]).val()).toEqual(ops[0].storageServiceId);
    expect($(cb[0]).is(":checked")).toBe(true);
    expect($(cb[1]).is(":checked")).toBe(false);
});

test('back saves Job and redirects correctly when format is BagIt', () => {
    let controller = getController();
    controller.job.packageOp = new PackageOperation();
    controller.job.packageOp.packageFormat = 'BagIt';
    testUncheckIsSaved(controller, 'back');
    expect(location.href).toMatch('#JobMetadata/show');
});

test('back saves Job and redirects correctly when format is not BagIt', () => {
    let controller = getController();
    testUncheckIsSaved(controller, 'back');
    expect(location.href).toMatch('#JobPackaging/show');
});

test('next saves Job and redirects correctly', () => {
    let controller = getController();
    testUncheckIsSaved(controller, 'next');
    expect(location.href).toMatch('#JobRun/show');
});
