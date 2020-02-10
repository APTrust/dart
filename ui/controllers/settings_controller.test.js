const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { ExportSettings } = require('../../core/export_settings');
const fs = require('fs');
const path = require('path');
const { SettingsController } = require('./settings_controller');
const { SettingsExportForm } = require('../forms/settings_export_form');
const { RemoteRepository } = require('../../core/remote_repository');
const { StorageService } = require('../../core/storage_service');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');

const SettingsUrl = 'https://raw.githubusercontent.com/APTrust/dart/master/test/fixtures/import_settings.json';
const SettingsFile = path.join(__dirname, '..', '..', 'test', 'fixtures', 'import_settings.json');

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
    controller._importSettingsFromUrl(SettingsUrl);

    setTimeout(() => {
        expect(AppSetting.find(AppSettingId)).toBeDefined()
        expect(RemoteRepository.find(RemoteRepoId)).toBeDefined()
        expect(StorageService.find(StorageServiceId)).toBeDefined()
        done();
    }, 1000)
})

test('Import from JSON text', () => {
    let controller = new SettingsController();
    var json = fs.readFileSync(SettingsFile, 'utf8');
    expect(controller._importWithErrHandling(json, null)).toBe(true);
    expect(AppSetting.find(AppSettingId)).toBeDefined()
    expect(RemoteRepository.find(RemoteRepoId)).toBeDefined()
    expect(StorageService.find(StorageServiceId)).toBeDefined()
})

test('Import from bad protocol', () => {
    let controller = new SettingsController();
    let response = controller.import()
    UITestUtil.setDocumentBody(response);
    controller._importSettingsFromUrl("xyz://not-valid");
    let errMessage = $('#result').text();
    expect(errMessage).toMatch(Context.y18n.__("Error retrieving profile"));
})

test('Import from invalid URL', () => {
    let controller = new SettingsController();
    let response = controller.import()
    UITestUtil.setDocumentBody(response);
    controller._importSettingsFromUrl(667);
    let errMessage = $('#result').text();
    expect(errMessage).toMatch(Context.y18n.__("Please enter a valid URL"));
})

test('Import unparsable data from valid URL', done => {
    let controller = new SettingsController();
    let response = controller.import()
    UITestUtil.setDocumentBody(response);
    controller._importSettingsFromUrl("https://google.com");

    setTimeout(() => {
        let errMessage = $('#result').text();
        expect(errMessage).toMatch(Context.y18n.__("Error importing settings"));
        done();
    }, 1000)
})

test('Import unparsable JSON from text area', () => {
    let controller = new SettingsController();
    let response = controller.import()
    UITestUtil.setDocumentBody(response);
    var json = '<Not Valid>';
    expect(controller._importWithErrHandling(json, null)).toBe(false);
    let errMessage = $('#result').text();
    expect(errMessage).toMatch(Context.y18n.__("Error importing settings"));
})

test('Import parsable JSON with invalid settings', () => {
    // AppSetting.name cannot be null.
    let invalidData = "{ appSettings: [{name: null}] }"
    let controller = new SettingsController();
    let response = controller.import()
    UITestUtil.setDocumentBody(response);
    expect(controller._importWithErrHandling(invalidData, null)).toBe(false);
    let errMessage = $('#result').text();
    expect(errMessage).toMatch(Context.y18n.__("Error importing settings"));
})


test('Export page lists all available items for export', () => {
    let controller = new SettingsController();
    let response = controller.export()
    let items = ["App Setting", "BagIt Profile",
                 "Remote Repository", "Storage Service"]
    for (let item of items) {
        for (let i = 0; i < 3; i++) {
            expect(response.container).toMatch(`${item} ${i}`);
        }
    }
})

test('Get selected items for export', () => {
    let controller = new SettingsController();
    let response = controller.export()
    UITestUtil.setDocumentBody(response);

    // Check one box from each list
    let listNames = [
        'appSettings',
        'bagItProfiles',
        'remoteRepositories',
        'storageServices'
    ];
    for (let listName of listNames) {
        let cb = $(`input[name=${listName}]`)[1];
        $(cb).attr('checked', true);
    }
    let form = new SettingsExportForm(new ExportSettings());
    let items = form.getSelectedItems();
    expect(items.appSettings.length).toEqual(1);
    expect(items.bagItProfiles.length).toEqual(1);
    expect(items.remoteRepositories.length).toEqual(1);
    expect(items.storageServices.length).toEqual(1);

    expect(items.appSettings[0].name).toEqual('App Setting 1');
    expect(items.bagItProfiles[0].name).toEqual('BagIt Profile 1');
    expect(items.remoteRepositories[0].name).toEqual('Remote Repository 1');
    expect(items.storageServices[0].name).toEqual('Storage Service 1');
})

test('Show exported JSON', () => {
    let controller = new SettingsController();
    let response = controller.export()
    UITestUtil.setDocumentBody(response);

    // Check one box from each list
    let listNames = [
        'appSettings',
        'bagItProfiles',
        'remoteRepositories',
        'storageServices'
    ];
    for (let listName of listNames) {
        let cb = $(`input[name=${listName}]`)[1];
        $(cb).attr('checked', true);
    }

    let modalResponse = controller.showExportJson();
    expect(modalResponse.modalContent).toMatch('App Setting 1');
    expect(modalResponse.modalContent).toMatch('BagIt Profile 1');
    expect(modalResponse.modalContent).toMatch('Remote Repository 1');
    expect(modalResponse.modalContent).toMatch('Storage Service 1');
})
