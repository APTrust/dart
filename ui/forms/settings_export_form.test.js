const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { RemoteRepository } = require('../../core/remote_repository');
const { SettingsExportForm } = require('./settings_export_form');
const { StorageService } = require('../../core/storage_service');

beforeEach(() => {
    cleanupPersistentData();
});

afterAll(() => {
    cleanupPersistentData();
});

function cleanupPersistentData() {
    TestUtil.deleteJsonFile('AppSetting');
    TestUtil.deleteJsonFile('BagItProfile');
    TestUtil.deleteJsonFile('InternalSetting');
    TestUtil.deleteJsonFile('RemoteRepository');
    TestUtil.deleteJsonFile('StorageService');
}

// IMPORT/EXPORT
// TODO: Test

// test('create()', () => {

// });

// test('getSelectedItems()', () => {

// });
