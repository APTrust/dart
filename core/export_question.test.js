const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const { ExportQuestion } = require('./export_question');
const { RemoteRepository } = require('./remote_repository');
const { StorageService } = require('./storage_service');
const { TestUtil } = require('./test_util');
const { Util } = require('./util');

beforeAll(() => {
    TestUtil.deleteJsonFile('AppSetting');
    TestUtil.deleteJsonFile('BagItProfile');
    TestUtil.deleteJsonFile('RemoteRepository');
    TestUtil.deleteJsonFile('StorageService');
});

afterAll(() => {
    TestUtil.deleteJsonFile('AppSetting');
    TestUtil.deleteJsonFile('BagItProfile');
    TestUtil.deleteJsonFile('RemoteRepository');
    TestUtil.deleteJsonFile('StorageService');
});


test('Constructor sets expected properties', () => {
    let obj = new ExportQuestion({
        prompt: "The prompt",
        objType: "App Setting",
        objId: "1234",
        field: "apiToken"
    });
    expect(obj.prompt).toEqual("The prompt");
    expect(obj.objType).toEqual("App Setting");
    expect(obj.objId).toEqual("1234");
    expect(obj.field).toEqual("apiToken");
});

// TODO: Test copyResponseToObject

test('copyResponseToObject', () => {
    let opts = { name: "xx" };
    let appSetting = new AppSetting(opts).save();
    let profile = new BagItProfile(opts).save();
    let repo = new RemoteRepository(opts).save();
    let ss = new StorageService(opts).save();

    // Make sure we can set AppSetting...
    let q = new ExportQuestion({
        prompt: "",
        objType: Context.y18n.__("App Setting"),
        objId: appSetting.id,
        field: "value"
    });
    q.copyResponseToObject("User Response");
    appSetting = AppSetting.find(appSetting.id);
    expect(appSetting.value).toEqual("User Response");

    // BagIt Profile
});
