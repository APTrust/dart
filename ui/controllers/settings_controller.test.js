const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { SettingsController } = require('./settings_controller');
const { RemoteRepository } = require('../../core/remote_repository');
const { StorageService } = require('../../core/storage_service');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');

const SettingsUrl = 'https://raw.githubusercontent.com/APTrust/dart/master/test/fixtures/import_settings.json';

// These ids are in the settings at the URL above. They should be
// loaded into the local DB after we import from the URL.
const AppSettingId = "00000000-0000-0000-0000-000000000100";
const RemoteRepoId = "00000000-0000-0000-0000-000000000200";
const StorageServiceId = "00000000-0000-0000-0000-000000000300";


beforeEach(() => {
    cleanupPersistentData();
    createTestObjects();
});

afterAll(() => {
    cleanupPersistentData();
});

function cleanupPersistentData() {
    TestUtil.deleteJsonFile('AppSetting');
    TestUtil.deleteJsonFile('BagItProfile');
    TestUtil.deleteJsonFile('RemoteRepository');
    TestUtil.deleteJsonFile('StorageService');
}

function createTestObjects() {
    for (let i=0; i < 3; i++) {
        new AppSetting({name: `App Setting ${i}`}).save();
        new BagItProfile({name: `BagIt Profile ${i}`}).save();
        new RemoteRepository({name: `Remote Repository ${i}`}).save();
        new StorageService({name: `Storage Service ${i}`}).save();
    }
}


// IMPORT/EXPORT
// TODO: Post sample files (good and bad) to GitHub URL
// TODO: Test!
// TODO: 'Copy to Clipboard' button

test('Show import page', () => {
    let controller = new SettingsController();
    UITestUtil.setDocumentBody(controller.import());
    controller.postRenderCallback('import');
    let containerHTML = $('#container').html();

    // Look for output about recent jobs.
    expect(containerHTML).toMatch(Context.y18n.__('Import from URL'));
    expect(containerHTML).toMatch(Context.y18n.__('Import from JSON'));
    expect(containerHTML).toMatch('btnImport');
})

test('Import from URL', done => {
    let controller = new SettingsController();
    UITestUtil.setDocumentBody(controller.import());
    controller.postRenderCallback('import');
    let containerHTML = $('#container').html();

    //$('#importSurceUrl').attr('checked', true);
    //$('#txtUrl').val(SettingsURL);
    //$('#btnImport').click();

    controller._importSettingsFromUrl(SettingsUrl);

    setTimeout(() => {
        expect(AppSetting.find(AppSettingId)).toBeDefined()
        expect(RemoteRepository.find(RemoteRepoId)).toBeDefined()
        expect(StorageService.find(StorageServiceId)).toBeDefined()
        done();
    }, 1200)
})

test('Import from textarea', () => {

})

test('Import from invalid URL', () => {

})

test('Import unparsable data from valid URL', () => {

})

test('Import unparsable JSON from text area', () => {

})

test('Import parsable JSON with invalid settings', () => {

})


test('Show export page', () => {

})

test('Get selected items for export', () => {

})

test('Show exported JSON', () => {

})

test('JSON filter filters sensitive data', () => {

})
