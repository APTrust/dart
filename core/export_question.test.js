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
    let ss = new StorageService({
        name: 'ss1',
        protocol: 's3',
        host: 'example.com',
    }).save();

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
    let tagDef = profile.firstMatchingTag("tagName", "Source-Organization");
    expect(tagDef).not.toBeNull();
    q.objType = Context.y18n.__("BagIt Profile");
    q.objId = profile.id;
    q.field = tagDef.id;
    q.copyResponseToObject("Springfield Power Plant");
    profile = BagItProfile.find(profile.id);
    tagDef = profile.firstMatchingTag("tagName", "Source-Organization");
    expect(tagDef.getValue()).toEqual("Springfield Power Plant");

    // Remote Repository
    q.objType = Context.y18n.__("Remote Repository");
    q.objId = repo.id;
    q.field = 'userId';
    q.copyResponseToObject("homer");
    repo = RemoteRepository.find(repo.id);
    expect(repo.userId).toEqual("homer");

    // Storage Service
    q.objType = Context.y18n.__("Storage Service");
    q.objId = ss.id;
    q.field = 'description';
    q.copyResponseToObject("banker's box");
    ss = StorageService.find(ss.id);
    expect(ss.description).toEqual("banker's box");
});
