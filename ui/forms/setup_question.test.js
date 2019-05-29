const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const path = require('path');
const { SetupQuestion } = require('./setup_question');
const Templates = require('../common/templates');
const { UITestUtil } = require('../common/ui_test_util');

const settingId = 'cfecb3ae-55f1-44cf-88ea-d33a5fcfe6b3';
const profileId = 'bf782457-72a4-498f-9bf2-6bc21bfc71e3';

const settingValue = '10:00';
const tagValue = 'default organization';

beforeAll(() => {
    let appSetting = new AppSetting({
        name: 'test name',
        value: settingValue
    });
    appSetting.id = settingId;
    appSetting.save();

    let profile = BagItProfile.load(path.join(
        __dirname, '..', '..', 'test', 'profiles', 'multi_manifest.json'));
    profile.id = profileId;
    let tag = profile.getTagsFromFile('bag-info.txt', 'Source-Organization')[0];
    tag.defaultValue = tagValue;
    profile.save();
});

afterAll(() => {
    AppSetting.find(settingId).delete();
    BagItProfile.find(profileId).delete();
});

// Need --runInBand to ensure this works.
afterEach(() => {
    let setting = AppSetting.find(settingId);
    setting.value = settingValue;
    setting.save();

    let profile = BagItProfile.find(profileId);
    let tag = profile.getTagsFromFile('bag-info.txt', 'Source-Organization')[0];
    tag.defaultValue = tagValue;
    profile.save();
});

const settingOpts = {
    question: 'What time is it?',
    heading: 'Question 1',
    error: 'I asked you what time it is.',
    options: ['9:00', settingValue, '11:00'],
    validator: function(value) {
        return value == '11:00';
    },
    mapsToProperty: {
        type: 'AppSetting',
        id: settingId,
        property: 'value'
    }
}

const tagOpts = {
    question: "Where's Waldo?",
    heading: 'Question 2',
    error: 'Nothing will come of nothing. Speak again.',
    validator: function(value) {
        return value.length > 2;
    },
    mapsToProperty: {
        type: 'BagItProfile',
        id: profileId,
        tagFile: 'bag-info.txt',
        tagName: 'Source-Organization'
    }
}

test('Constructor sets expected fields', () => {
    let q = new SetupQuestion(settingOpts);
    expect(q.label).toEqual(settingOpts.question);
    expect(q.heading).toEqual(settingOpts.heading);
    expect(q.value).toEqual(settingValue);
    expect(q.error).toEqual(settingOpts.error);
    expect(q.choices).toEqual(Choice.makeList(settingOpts.options, settingValue, true));
    expect(q.validator).toEqual(settingOpts.validator);
});

test('readUserInput()', () => {
    let q = new SetupQuestion(settingOpts);
    let html = Templates.partials['inputText']({
        field: q
    })

    UITestUtil.setDocumentBody({ container: html});
    expect(q.readUserInput()).toEqual(settingValue);

    $(`#${q.id}`).val('12345678');
    expect(q.readUserInput()).toEqual('12345678');

    // Check casting
    q.dataType = 'number';
    $(`#${q.id}`).val('88');
    expect(q.readUserInput()).toEqual(88);

    q.dataType = 'boolean';
    $(`#${q.id}`).val('true');
    expect(q.readUserInput()).toBe(true);
    $(`#${q.id}`).val('false');
    expect(q.readUserInput()).toBe(false);

});

test('setInitialValue sets value from setting', () => {
    let q = new SetupQuestion(settingOpts);
    q.setInitialValue()
    expect(q.value).toBe(settingValue);
});

test('setInitialValue sets value from BagItProfile tag', () => {
    let q = new SetupQuestion(tagOpts);
    q.setInitialValue()
    expect(q.value).toBe(tagValue);
});

test('processResponse returns false if invalid', () => {
    let q = new SetupQuestion(settingOpts);
    q.readUserInput = jest.fn(() => { return '12:00' });
    expect(q.processResponse()).toBe(false);
});

test('processResponse returns true if valid', () => {
    let q = new SetupQuestion(settingOpts);
    q.readUserInput = jest.fn(() => { return '11:00' });
    expect(q.processResponse()).toBe(true);
});

test('processResponse sets property if valid', () => {
    let q = new SetupQuestion(settingOpts);
    q.readUserInput = jest.fn(() => { return '11:00' });
    expect(q.processResponse()).toBe(true);

    let setting = AppSetting.find(settingId);
    expect(setting.value).toEqual('11:00');
});

test('processResponse sets tag value if valid', () => {
    let q = new SetupQuestion(tagOpts);
    q.readUserInput = jest.fn(() => { return 'Example Org' });
    expect(q.processResponse()).toBe(true);

    let profile = BagItProfile.find(profileId);
    let tag = profile.getTagsFromFile('bag-info.txt', 'Source-Organization')[0];
    expect(tag.getValue()).toEqual('Example Org');
});

test('getRequiredValidator()', () => {
    let v = SetupQuestion.getRequiredValidator();
    expect(typeof v).toEqual('function');
    expect(v('1008')).toBe(true);
    expect(v(1008)).toBe(true);
    expect(v(true)).toBe(true);
    expect(v(false)).toBe(true);
    expect(v('')).toBe(false);
    expect(v()).toBe(false);
    expect(v(null)).toBe(false);
});

test('getPatternValidator()', () => {
    let v = SetupQuestion.getPatternValidator(/^\d+$/);
    expect(typeof v).toEqual('function');
    expect(v('1008')).toBe(true);
    expect(v('Doh!')).toBe(false);
});

test('getIntRangeValidator()', () => {
    let v = SetupQuestion.getIntRangeValidator(1, 10);
    expect(typeof v).toEqual('function');
    expect(v(1)).toBe(true);
    expect(v(10)).toBe(true);
    expect(v('1')).toBe(true);
    expect(v('10')).toBe(true);
    expect(v(20)).toBe(false);
    expect(v('')).toBe(false);
    expect(v()).toBe(false);

    // Allow empty value
    v = SetupQuestion.getIntRangeValidator(1, 10, true);
    expect(v('10')).toBe(true);
    expect(v(20)).toBe(false);
    expect(v('')).toBe(true);
    expect(v()).toBe(true);
});
