const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { BagValidationController } = require('./bag_validation_controller');
const os = require('os');
const path = require('path');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const { ValidationOperation } = require('../../core/validation_operation');

beforeAll(() => {
    loadProfiles();
});

afterAll(() => {
    TestUtil.deleteJsonFile('BagItProfile');
});

function loadProfiles() {
    let profiles = ["aptrust_2.2.json", "btr-v0.1.json", "empty_profile.json"];
    for (let file of profiles) {
        let jsonFile = path.join(__dirname, '..', '..', 'profiles', file);
        let profile = BagItProfile.load(jsonFile);
        profile.save();
    }
}

function testValidateBag(bagpath, profileName, done) {
    jest.setTimeout(10000);
    let controller = new BagValidationController();
    let response = controller.show();
    UITestUtil.setDocumentBody(response);
    controller.postRenderCallback('show');

    // We cannot programmatically set the value of the file input
    // due to security restrictions, so we'll have to force the
    // underlying to form to set canned values before we call
    // validateBag().
    controller.form.parseFromDOM = function() {
        controller.form.obj.bagItProfile = BagItProfile.find(Constants.BUILTIN_PROFILE_IDS[profileName]);
        controller.form.obj.validationOp = new ValidationOperation();
        controller.form.obj.validationOp.pathToBag = bagpath;
    }

    controller.validateBag();

    // Longer timeout for AppVeyor tests
    timeout = os.platform() == 'win32' ? 2300 : 2000;
    setTimeout(function() {
        expect($('#dartProcessContainer').html()).toMatch(Context.y18n.__('Job completed successfully.'));
        done();
    }, timeout)
}

test('constructor', () => {
    let controller = new BagValidationController();
    expect(controller.job).not.toBeNull();
});

test('show', () => {
    let controller = new BagValidationController();
    let response = controller.show();

    UITestUtil.setDocumentBody(response);
    controller.postRenderCallback('show');

    let profileOptions = $('#jobForm_bagItProfile option').map(
        function(opt) {
            return $(this).val()
        }).get();
    expect(profileOptions).toEqual(expect.arrayContaining([
        Constants.BUILTIN_PROFILE_IDS['aptrust'],
        Constants.BUILTIN_PROFILE_IDS['btr'],
        Constants.BUILTIN_PROFILE_IDS['empty'],
    ]));

    let selectedOp = $('#jobForm_bagItProfile option:selected').val();
    expect(selectedOp).toEqual(Constants.BUILTIN_PROFILE_IDS['empty']);

    expect($('input[name=bagType]').length).toEqual(2);
    expect($('input[name=bagType]').val()).toEqual('file');
});

test('validate serialized bag', done => {
    let bagpath = path.join(__dirname, '..', '..', 'test', 'bags', 'aptrust', 'example.edu.sample_good.tar');
    testValidateBag(bagpath, 'empty', done);
});

test('validate unserialized bag', done => {
    let bagpath = path.join(__dirname, '..', '..', 'test', 'bags', 'aptrust', 'example.edu.sample_good');
    testValidateBag(bagpath, 'empty', done);
});
