const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Job } = require('../../core/job');
const { JobUploadController } = require('./job_upload_controller');
const { PackageOperation } = require('../../core/package_operation');
const path = require('path');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const { UploadOperation } = require('../../core/upload_operation');
const { UploadTarget } = require('../../core/upload_target');
const { Util } = require('../../core/util');

beforeEach(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('UploadTarget');
});

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('UploadTarget');
});

function getUploadTarget(name, proto, host) {
    let target = new UploadTarget({
        name: name,
        protocol: proto,
        host: host
    });
    target.save();
    return target;
}

function getJob() {
    var job = new Job();
    job.uploadOps = [
        new UploadOperation(),
        new UploadOperation()
    ];
    job.uploadOps[0].uploadTargetId = getUploadTarget('target1', 's3', 'target1.com').id;
    job.uploadOps[1].uploadTargetId = getUploadTarget('target2', 's3', 'target2.com').id;
    job.save();
    return job;
}

function getController() {
    let job = getJob();
    let params = new URLSearchParams({ id: job.id });
    return new JobUploadController(params);
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
    expect($(cb[0]).val()).toEqual(ops[0].uploadTargetId);
    expect($(cb[0]).is(":checked")).toBe(true);
    expect($(cb[1]).val()).toEqual(ops[1].uploadTargetId);
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
    expect($(cb[0]).val()).toEqual(ops[0].uploadTargetId);
    expect($(cb[0]).is(":checked")).toBe(true);
    expect($(cb[1]).is(":checked")).toBe(false);
});
