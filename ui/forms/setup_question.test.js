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

beforeAll(() => {
    let appSetting = new AppSetting({
        name: 'test name',
        value: '10:00'
    });
    appSetting.id = settingId;
    appSetting.save();

    let profile = BagItProfile.load(path.join(
        __dirname, '..', '..', 'test', 'profiles', 'multi_manifest.json'));
    profile.id = profileId;
    let tag = profile.getTagsFromFile('bag-info.txt', 'Source-Organization')[0];
    tag.defaultValue = 'default organization';
    profile.save();
});

afterAll(() => {
    AppSetting.find(settingId).delete();
    BagItProfile.find(profileId).delete();
});

const opts1 = {
    question: 'What time is it?',
    heading: 'Question 1',
    error: 'I asked you what time it is.',
    options: ['9:00', '10:00', '11:00'],
    validator: function(value) {
        return value == '11:00';
    },
    mapsToProperty: {
        type: 'AppSetting',
        id: settingId,
        property: 'value'
    }
}

const opts2 = {
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
    let q = new SetupQuestion(opts1);
    expect(q.label).toEqual(opts1.question);
    expect(q.heading).toEqual(opts1.heading);
    expect(q.value).toEqual('10:00');
    expect(q.error).toEqual(opts1.error);
    expect(q.choices).toEqual(Choice.makeList(opts1.options, '10:00', true));
    expect(q.validator).toEqual(opts1.validator);
});

test('readUserInput()', () => {
    let q = new SetupQuestion(opts1);
    let html = Templates.partials['inputText']({
        field: q
    })

    UITestUtil.setDocumentBody({ container: html});
    expect(q.readUserInput()).toEqual('10:00');

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

test('processResponse returns false if invalid', () => {
    let q = new SetupQuestion(opts1);
    q.readUserInput = jest.fn(() => { return '12:00' });
    expect(q.processResponse()).toBe(false);
});

test('processResponse returns true if valid', () => {
    let q = new SetupQuestion(opts1);
    q.readUserInput = jest.fn(() => { return '11:00' });
    expect(q.processResponse()).toBe(true);
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
