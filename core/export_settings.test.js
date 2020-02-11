const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('./constants');
const { ExportSettings } = require('./export_settings');
const fs = require('fs');
const path = require('path');
const { RemoteRepository } = require('./remote_repository');
const { StorageService } = require('./storage_service');
const { TestUtil } = require('./test_util');
const { Util } = require('./util');

test('Constructor sets expected properties', () => {
    let obj = new ExportSettings();
    expect(obj.id).toEqual(Constants.EMPTY_UUID);
});

test('toJson() produces expected JSON', () => {
    let fixturePath = path.join(__dirname, "..", "test", "fixtures",
                                "export_settings.json");
    let jsonData = fs.readFileSync(fixturePath);
    let obj = new ExportSettings(JSON.parse(jsonData))
    expect(obj.toJson()).toEqual(jsonData.toString());
})

test('toJson() calls _jsonFilter when appropriate', () => {
    let fixturePath = path.join(__dirname, "..", "test", "fixtures",
                                "export_settings.json");
    let jsonData = fs.readFileSync(fixturePath);
    let obj = new ExportSettings(JSON.parse(jsonData))

    obj._jsonFilter = jest.fn()
    obj.toJson();
    expect(obj._jsonFilter).toHaveBeenCalled();
})

test('JSON filter filters sensitive data', () => {
    let obj = new ExportSettings();
    let unsafe = ['login', 'password', 'userId', 'apiToken']
    let exclude = ['userCanDelete', 'errors']

    // Filter credential values, unless they point to env vars.
    for (let item of unsafe) {
        expect(obj._jsonFilter(item, 'value')).toEqual('');
        expect(obj._jsonFilter(item, 'env:value')).toEqual('env:value');
    }
    // We don't serialize these things at all.
    for (let item of exclude) {
        expect(obj._jsonFilter(item, 'value')).not.toBeDefined();
    }
    // We serialize 'required' as long as it's not an array.
    expect(obj._jsonFilter('required', true)).toBe(true);
    expect(obj._jsonFilter('required', false)).toBe(false);
    expect(obj._jsonFilter('required', ['ha'])).not.toBeDefined();
})

test('getIds() returns expected ids', () => {
    let fixturePath = path.join(__dirname, "..", "test", "fixtures",
                                "export_settings.json");
    let jsonData = fs.readFileSync(fixturePath);
    let obj = new ExportSettings(JSON.parse(jsonData))
    expect(obj.getIds("appSettings")).toEqual(
        ["7439d47a-4a38-45ca-a587-e8ef7d0ca192",
         "00000000-0000-0000-0000-000000000100"]);
    expect(obj.getIds("bagItProfiles")).toEqual(
        ["09c834a7-6b51-49dd-9498-b310ee3e5a6a"]);
    expect(obj.getIds("remoteRepositories")).toEqual([
        "214db814-bd73-49d4-b988-4d7a5ad0d313",
        "00000000-0000-0000-0000-000000000200"]);
    expect(obj.getIds("storageServices")).toEqual([
        "b3877424-296e-4693-a840-3577c1efe91b",
        "00000000-0000-0000-0000-000000000300"]);
    expect(obj.getIds("doesNotExist")).toEqual([]);
})

test('anythingSelected()', () => {
    let obj = new ExportSettings();
    console.log(JSON.stringify(obj));
    expect(obj.anythingSelected()).toBe(false);

    obj.appSettings.push(new AppSetting());
    expect(obj.anythingSelected()).toBe(true);
    obj.appSettings = [];

    obj.bagItProfiles.push(new BagItProfile());
    expect(obj.anythingSelected()).toBe(true);
    obj.bagItProfiles = [];

    obj.remoteRepositories.push(new RemoteRepository());
    expect(obj.anythingSelected()).toBe(true);
    obj.remoteRepositories = [];

    obj.storageServices.push(new StorageService());
    expect(obj.anythingSelected()).toBe(true);
    obj.storageServices = [];

    expect(obj.anythingSelected()).toBe(false);
});
