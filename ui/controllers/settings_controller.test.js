const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { ExportQuestion } = require('../../core/export_question');
const { ExportSettings } = require('../../core/export_settings');
const fs = require('fs');
const path = require('path');
const { SettingsController } = require('./settings_controller');
const { SettingsExportForm } = require('../forms/settings_export_form');
const { RemoteRepository } = require('../../core/remote_repository');
const { StorageService } = require('../../core/storage_service');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const url = require('url');

const SettingsUrl = 'https://raw.githubusercontent.com/APTrust/dart/master/test/fixtures/import_settings.json';
const SettingsFile = path.join(__dirname, '..', '..', 'test', 'fixtures', 'import_settings.json');

// These ids are in the settings at the URL above. They should be
// loaded into the local DB after we import from the URL.
const AppSettingId = "00000000-0000-0000-0000-000000000100";
const RemoteRepoId = "00000000-0000-0000-0000-000000000200";
const StorageServiceId = "00000000-0000-0000-0000-000000000300";

const listNames = [
    'appSettings',
    'bagItProfiles',
    'remoteRepositories',
    'storageServices'
];


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
    TestUtil.deleteJsonFile('ExportSettings');
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

function createExportSettings() {
    let settings = new ExportSettings();
    settings.appSettings = AppSetting.list();
    settings.bagItProfiles = BagItProfile.list();
    settings.remoteRepositories = RemoteRepository.list();
    settings.storageServices = StorageService.list();
    settings.questions = getQuestions();
    settings.save();
    return settings;
}

function getQuestions() {
    let appSetting = AppSetting.list()[0];
    let profile = BagItProfile.inflateFrom(BagItProfile.list()[0]);
    let repo = RemoteRepository.list()[0];
    let ss = StorageService.list()[0];
    let tagDef = profile.firstMatchingTag("tagName", "Source-Organization");
    return [
        new ExportQuestion({
            prompt: "AppSetting question",
            objType: "AppSetting",
            objId: appSetting.id,
            field: "value"
        }),
        new ExportQuestion({
            prompt: "BagItProfile question",
            objType: "BagItProfile",
            objId: profile.id,
            field: tagDef.id
        }),
        new ExportQuestion({
            prompt: "RemoteRepository question",
            objType: "RemoteRepository",
            objId: repo.id,
            field: "userId"
        }),
        new ExportQuestion({
            prompt: "StorageService question",
            objType: "StorageService",
            objId: ss.id,
            field: "bucket"
        }),
    ];
}

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
    form.parseItemsForExport();
    expect(form.obj.appSettings.length).toEqual(1);
    expect(form.obj.bagItProfiles.length).toEqual(1);
    expect(form.obj.remoteRepositories.length).toEqual(1);
    expect(form.obj.storageServices.length).toEqual(1);

    expect(form.obj.appSettings[0].name).toEqual('App Setting 1');
    expect(form.obj.bagItProfiles[0].name).toEqual('BagIt Profile 1');
    expect(form.obj.remoteRepositories[0].name).toEqual('Remote Repository 1');
    expect(form.obj.storageServices[0].name).toEqual('Storage Service 1');
})

test('Show exported JSON', () => {
    let params = new url.URLSearchParams({ fromPage: "export" });
    let controller = new SettingsController(params);
    let response = controller.export()
    UITestUtil.setDocumentBody(response);

    // Check one box from each list
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


test('reset', () => {
    let settings = createExportSettings();
    let controller = new SettingsController();
    let response = controller.export()
    UITestUtil.setDocumentBody(response);

    // Should show form with all items checked on each list.
    // Three items on each of four lists.
    expect($("input:checked").length).toEqual(12);

    // After reset, nothing should be checked.
    response = controller.reset()
    UITestUtil.setDocumentBody(response);
    expect($("input:checked").length).toEqual(0);
});

// saveAndGoToExport
// saveAndGoToQuestions
// showQuestionsForm
// reset (button click)
// add questions (checkbox click)
// add questions (button click)
// add question (button click)
// delete question (button click)


// IMPORT/EXPORT
// TODO: Post sample files (good and bad) to GitHub URL
// Test all new question export features.
