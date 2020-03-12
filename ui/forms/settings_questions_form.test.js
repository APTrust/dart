const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { ExportQuestion } = require('../../core/export_question');
const { ExportSettings } = require('../../core/export_settings');
const { RemoteRepository } = require('../../core/remote_repository');
const { StorageService } = require('../../core/storage_service');
const { SettingsQuestionsForm } = require('./settings_questions_form');
const { TestUtil } = require('../../core/test_util');

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

test('constructor()', () => {
    let form = new SettingsQuestionsForm(new ExportSettings());

    // ExportSettings with no questions should have fields
    // for one new question, but no more.
    expect(form.fields['prompt_0']).toBeDefined();
    expect(form.fields['objType_0']).toBeDefined();
    expect(form.fields['objId_0']).toBeDefined();
    expect(form.fields['field_0']).toBeDefined();

    expect(form.fields['prompt_1']).not.toBeDefined();
    expect(form.fields['objType_1']).not.toBeDefined();
    expect(form.fields['objId_1']).not.toBeDefined();
    expect(form.fields['field_1']).not.toBeDefined();
});

test('constructor with existing questions', () => {
    let opts = { name: "xx" };
    let repo = new RemoteRepository(opts).save();
    let profile = new BagItProfile(opts).save();
    let tagDef = profile.firstMatchingTag("tagName", "Source-Organization");
    let settings = new ExportSettings();
    settings.questions = [
        new ExportQuestion({
            prompt: "Q1",
            objType: "RemoteRepository",
            objId: repo.id,
            field: "userId"
        }),
        new ExportQuestion({
            prompt: "Q2",
            objType: "BagItProfile",
            objId: profile.id,
            field: tagDef.id
        }),
    ];
    settings.bagItProfiles = [profile];
    settings.remoteRepositories = [repo];
    let form = new SettingsQuestionsForm(settings);

    expect(form.fields['prompt_0'].value).toEqual('Q1');
    expect(form.fields['objType_0'].value).toEqual('RemoteRepository');
    expect(form.fields['objId_0'].value).toEqual(repo.id);
    expect(form.fields['field_0'].value).toEqual('userId');
    expect(form.fields['field_0'].choices.length).toEqual(6);

    expect(form.fields['prompt_1'].value).toEqual('Q2');
    expect(form.fields['objType_1'].value).toEqual('BagItProfile');
    expect(form.fields['objId_1'].value).toEqual(profile.id);
    expect(form.fields['field_1'].value).toEqual(tagDef.id);
    expect(form.fields['field_1'].choices.length).toEqual(14);
});
