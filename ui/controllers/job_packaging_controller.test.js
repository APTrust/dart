const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const { JobPackagingController } = require('./job_packaging_controller');
const { PackageOperation } = require('../../core/package_operation');
const path = require('path');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const { Util } = require('../../core/util');

beforeEach(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('Profile');
    loadProfileIntoDB();
});

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('Profile');
});

const bagName = 'bag_name';
const packageFormat = 'BagIt';
const outputPath = '/dev/null';
const profileId = Constants.BUILTIN_PROFILE_IDS.aptrust;

function loadProfileIntoDB() {
    let profile = BagItProfile.load(
        path.join(__dirname, '..', '..', 'builtin', 'aptrust_bagit_profile_2.2.json'));
    profile.save();
}

function getJobWithPackageOp() {
    var job = new Job();
    job.packageOp = new PackageOperation('TestBag', '/dev/null');
    job.save();
    return job;
}

function getController() {
    let job = getJobWithPackageOp();
    let params = new URLSearchParams({ id: job.id });
    return new JobPackagingController(params);
}

function setFormValues(withProfileId) {
    $('#jobPackageOpForm_packageFormat').val(packageFormat);
    $('#jobPackageOpForm_packageName').val(bagName);
    $('#jobPackageOpForm_outputPath').val(outputPath);

    // BagIt format without a BagItProfile id is invalid.
    // We sometimes want to make invalid form data on purpose.
    if (withProfileId) {
        $('#jobPackageOpForm_bagItProfileId').val(profileId);
    } else {
        $('#jobPackageOpForm_bagItProfileId').val('');
    }
}

function assertFormFieldsPresent() {
    expect($('#jobPackageOpForm_packageFormat').length).toEqual(1);
    expect($('#jobPackageOpForm_packageName').length).toEqual(1);
    expect($('#jobPackageOpForm_outputPath').length).toEqual(1);
    expect($('#jobPackageOpForm_bagItProfileId').length).toEqual(1);
    expect($('#jobPackageOpForm_id').length).toEqual(1);
    expect($('#jobPackageOpForm_packageFormat option').length).toBeGreaterThan(2);
    expect($('#jobPackageOpForm_bagItProfileId option').length).toEqual(2);
}

test('constructor', () => {
    let controller = getController();
    expect(controller.model).toEqual(Job);
    expect(controller.job).not.toBeNull();
});

test('show', () => {
    let controller = getController();
    UITestUtil.setDocumentBody(controller.show())
    assertFormFieldsPresent();
});

test('back saves invalid form data', () => {
    let controller = getController();
    UITestUtil.setDocumentBody(controller.show())
    setFormValues(false);
    controller.back();

    let job = Job.find(controller.job.id);
    expect(job.packageOp.packageFormat).toEqual(packageFormat);
    expect(job.packageOp.packageName).toEqual(bagName);
    expect(job.packageOp.outputPath).toEqual(outputPath);
});

test('back saves valid form data', () => {
    let controller = getController();
    UITestUtil.setDocumentBody(controller.show())
    setFormValues(true);
    controller.back();

    let job = Job.find(controller.job.id);
    expect(job.packageOp.packageFormat).toEqual(packageFormat);
    expect(job.packageOp.packageName).toEqual(bagName);
    expect(job.packageOp.outputPath).toEqual(outputPath);
    expect(job.bagItProfile.id).toEqual(profileId);
});


test('back goes to the right place', () => {
    let controller = getController();
    controller.back();
    expect(location.href).toMatch('#JobFiles/show');
});

test('next does not move forward if data is invalid', () => {
    let controller = getController();
    setFormValues(false);
    let response = controller.next();
    UITestUtil.setDocumentBody(response)

    // Should show the form again, with errors.
    assertFormFieldsPresent();
    let expectedErrMsg = Context.y18n.__('When choosing BagIt format, you must choose a BagIt profile.');
    expect(response.container).toMatch(expectedErrMsg)
});

test('next saves data and moves forward if data is valid', () => {
    let controller = getController();
    UITestUtil.setDocumentBody(controller.show())
    setFormValues(true);
    controller.next();

    let job = Job.find(controller.job.id);
    expect(job.packageOp.packageFormat).toEqual(packageFormat);
    expect(job.packageOp.packageName).toEqual(bagName);
    expect(job.packageOp.outputPath).toEqual(outputPath);
    expect(job.bagItProfile.id).toEqual(profileId);

    expect(location.href).toMatch('#JobMetadata/show');
});


test('postRenderCallback attached change event', () => {
    let controller = getController();
    UITestUtil.setDocumentBody(controller.show())
    controller.postRenderCallback();
    let onChange = $._data($('select[name=packageFormat]')[0], "events").change[0].handler;
    expect(typeof onChange).toEqual('function');

});
