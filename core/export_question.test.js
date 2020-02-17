const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
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
        objType: "AppSetting",
        objId: "1234",
        field: "apiToken"
    });
    expect(obj.prompt).toEqual("The prompt");
    expect(obj.objType).toEqual("AppSetting");
    expect(obj.objId).toEqual("1234");
    expect(obj.field).toEqual("apiToken");
});

test('listNameFor', () => {
    expect(ExportQuestion.listNameFor('AppSetting')).toEqual('appSettings');
    expect(ExportQuestion.listNameFor('BagItProfile')).toEqual('bagItProfiles');
    expect(ExportQuestion.listNameFor('RemoteRepository')).toEqual('remoteRepositories');
    expect(ExportQuestion.listNameFor('StorageService')).toEqual('storageServices');
});


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
        objType: "AppSetting",
        objId: appSetting.id,
        field: "value"
    });
    q.copyResponseToObject("User Response");
    appSetting = AppSetting.find(appSetting.id);
    expect(appSetting.value).toEqual("User Response");

    // BagIt Profile
    let tagDef = profile.firstMatchingTag("tagName", "Source-Organization");
    expect(tagDef).not.toBeNull();
    q.objType = "BagItProfile";
    q.objId = profile.id;
    q.field = tagDef.id;
    q.copyResponseToObject("Springfield Power Plant");
    profile = BagItProfile.find(profile.id);
    tagDef = profile.firstMatchingTag("tagName", "Source-Organization");
    expect(tagDef.getValue()).toEqual("Springfield Power Plant");

    // Remote Repository
    q.objType = "RemoteRepository";
    q.objId = repo.id;
    q.field = 'userId';
    q.copyResponseToObject("homer");
    repo = RemoteRepository.find(repo.id);
    expect(repo.userId).toEqual("homer");

    // Storage Service
    q.objType = "StorageService";
    q.objId = ss.id;
    q.field = 'description';
    q.copyResponseToObject("banker's box");
    ss = StorageService.find(ss.id);
    expect(ss.description).toEqual("banker's box");
});

test('tryToGetValue', () => {
    let appSetting = new AppSetting({ name: "one", value: "two" }).save();
    let q = new ExportQuestion({
        prompt: "",
        objType: "AppSetting",
        objId: appSetting.id,
        field: "value"
    });
    expect(q.tryToGetValue()).toEqual("two");

    let profile = new BagItProfile({ name: 'abc' });
    let tagDef = profile.firstMatchingTag("tagName", "Source-Organization");
    tagDef.userValue = "Moe's Tavern"
    profile.save();
    q = new ExportQuestion({
        prompt: "",
        objType: "BagItProfile",
        objId: profile.id,
        field: tagDef.id
    });
    expect(q.tryToGetValue()).toEqual("Moe's Tavern");

    let repo = new RemoteRepository({
        name: 'Some Repo',
        url: 'https://repo.example.com'
    }).save();
    q = new ExportQuestion({
        prompt: "",
        objType: "RemoteRepository",
        objId: repo.id,
        field: "url"
    });
    expect(q.tryToGetValue()).toEqual("https://repo.example.com");

    let ss = new StorageService({
        name: 'ss1',
        protocol: 's3',
        host: 'example.com',
    }).save();
    q = new ExportQuestion({
        prompt: "",
        objType: "StorageService",
        objId: ss.id,
        field: "host"
    });
    expect(q.tryToGetValue()).toEqual("example.com");

    q = new ExportQuestion({
        prompt: "",
        objType: "StorageService",
        objId: ss.id,
        field: "field-does-not-exist"
    });
    expect(q.tryToGetValue()).toEqual("");

    q = new ExportQuestion({
        prompt: "",
        objType: "StorageService",
        objId: 'id-does-not-exist',
        field: "host"
    });
    expect(q.tryToGetValue()).toEqual("");
});
