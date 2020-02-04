const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { SettingsController } = require('./settings_controller');
const { RemoteRepository } = require('../../core/remote_repository');
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
// TODO: Post sample files (good and bad) to GitHub URL
// TODO: Test!
// TODO: 'Copy to Clipboard' button

// test('import()', () => {

// })

// test('export()', () => {

// })

// test('showExportJson()', () => {

// })

// test('_jsonFilter()', () => {

// })

// test('_importSettingsFromUrl()', () => {

// })

// test('_importSettingsFromTextArea()', () => {

// })

// test('Import bad URL', () => {

// })

// test('Import bad JSON', () => {

// })

// test('Import invalid settings', () => {

// })
