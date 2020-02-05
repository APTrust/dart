const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { RemoteRepository } = require('../../core/remote_repository');
const { SettingsExportForm } = require('./settings_export_form');
const { StorageService } = require('../../core/storage_service');
const { TestUtil } = require('../../core/test_util');

beforeAll(() => {
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

test('create()', () => {
    let form = new SettingsExportForm();
    expect(Object.keys(form.fields).length).toEqual(4);
    for (let field of Object.values(form.fields)) {
        expect(field.choices.length).toEqual(3);
    }
});

// Note: getSelectedItems is tested in
// ui/controllers/settings_controller.test.js
