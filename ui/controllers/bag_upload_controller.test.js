const $ = require('jquery');
//const { BagItProfile } = require('../../bagit/bagit_profile');
//const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { BagUploadController } = require('./bag_upload_controller');
const os = require('os');
const path = require('path');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const { Util } = require('../../core/util');
const { UploadOperation } = require('../../core/upload_operation');
const { UploadTestHelper } = require('../../util/upload_test_helper');
const { StorageService } = require('../../core');

beforeEach(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('StorageService');
});

afterAll(() => {
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('StorageService');
});

function testUploadBag(bagpath, done) {
    let helper = new UploadTestHelper()
    if (!helper.envHasS3Credentials()) {
        console.log('Skipping bag_upload_controller_test: no credentials in ENV.');
        done();
        return;
    }    
    jest.setTimeout(10000);
    let controller = new BagUploadController();
    let response = controller.show();
    UITestUtil.setDocumentBody(response);
    controller.postRenderCallback('show');

    let ss = helper.getStorageService()
    ss.save()

    // We cannot programmatically set the value of the file input
    // due to security restrictions, so we'll have to force the
    // underlying to form to set canned values before we call
    // validateBag().
    controller.form.parseFromDOM = function() {
        controller.form.obj.uploadOps = [ new UploadOperation() ];
        controller.form.obj.uploadOps[0].storageServiceId = ss.id
        if (Util.isDirectory(bagpath)) {
            let files = Util.walkSync(bagpath)
            controller.form.obj.uploadOps[0].sourceFiles = files.map((f) => { return f.absPath })
            //console.log(controller.form.obj.uploadOps[0].sourceFiles)
        } else {
            controller.form.obj.uploadOps[0].sourceFiles = [bagpath]
        }
    }

    controller.uploadBag();

    // Longer timeout for AppVeyor tests
    timeout = os.platform() == 'win32' ? 8000 : 4000;
    setTimeout(function() {
        expect($('#dartProcessContainer').html()).toMatch(Context.y18n.__('Job completed successfully.'));
        done();
    }, timeout)
}

test('constructor', () => {
    let controller = new BagUploadController();
    expect(controller.job).not.toBeNull();
});

test('show', () => {
    let helper = new UploadTestHelper()
    let ss = helper.getStorageService()
    ss.save()
    let ss2 = helper.getStorageService()
    ss2.save()

    let controller = new BagUploadController();
    let response = controller.show();

    UITestUtil.setDocumentBody(response);
    controller.postRenderCallback('show');

    let fileInput = $('#pathToBag')
    expect(fileInput.length).toEqual(1)    

    let uploadTargets = $('div.form-check')
    expect(uploadTargets.length).toEqual(2)
});

test('upload serialized bag', done => {
    let bagpath = path.join(__dirname, '..', '..', 'test', 'bags', 'aptrust', 'example.edu.sample_good.tar');
    testUploadBag(bagpath, done);
});

test('upload unserialized bag', done => {
    let bagpath = path.join(__dirname, '..', '..', 'test', 'bags', 'aptrust', 'example.edu.sample_good');
    testUploadBag(bagpath, done);
});
