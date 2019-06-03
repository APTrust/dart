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

function getSettingOpts() {
    return {
        id: 'q_1',
        question: 'What time is it?',
        heading: 'Question 1',
        errMessage: 'I asked you what time it is.',
        options: ['9:00', settingValue, '11:00'],
        validation: {
            required: true,
            pattern: '^11:00$'
        },
        mapsToProperty: {
            type: 'AppSetting',
            id: settingId,
            property: 'value'
        }
    }
}

function getTagOpts() {
    return {
        id: 'q_1',
        question: "Where's Waldo?",
        heading: 'Question 2',
        errMessage: 'Nothing will come of nothing. Speak again.',
        validation: {
            required: true,
            pattern: '.{2,}'  // any string of 2+ characters
        },
        mapsToProperty: {
            type: 'BagItProfile',
            id: profileId,
            tagFile: 'bag-info.txt',
            tagName: 'Source-Organization'
        }
    }
}

function getNumericOpts() {
    return {
        id: 'q_1',
        question: 'Choose a number between 1 and 10.',
        heading: 'Question 3',
        errMessage: 'Nope. Try again.',
        validation: {
            required: true,
            min: 1,
            max: 10
        },
        mapsToProperty: {
            type: 'AppSetting',
            id: settingId,
            property: 'value'
        }
    }
}

const barebonesOpts = {
    id: 'q_1',
    question: 'Tell us about it.',
    mapsToProperty: {
        type: 'AppSetting',
        id: settingId,
        property: 'value'
    }
}

test('Constructor sets expected fields', () => {
    let opts = getSettingOpts();
    let q = new SetupQuestion(opts);
    expect(q.label).toEqual(opts.question);
    expect(q.heading).toEqual(opts.heading);
    expect(q.value).toEqual(settingValue);
    expect(q.errMessage).toEqual(opts.errMessage);
    expect(q.choices).toEqual(Choice.makeList(opts.options, settingValue, true));
    expect(q.validation).toEqual(opts.validation);
});

test('readUserInput()', () => {
    let q = new SetupQuestion(getSettingOpts());
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
    let q = new SetupQuestion(getSettingOpts());
    q.setInitialValue()
    expect(q.value).toBe(settingValue);
});

test('setInitialValue sets value from BagItProfile tag', () => {
    let q = new SetupQuestion(getTagOpts());
    q.setInitialValue()
    expect(q.value).toBe(tagValue);
});

test('processResponse returns false if invalid', () => {
    let q = new SetupQuestion(getSettingOpts());
    q.readUserInput = jest.fn(() => { return '12:00' });
    expect(q.processResponse()).toBe(false);
});

test('processResponse returns true if valid', () => {
    let q = new SetupQuestion(getSettingOpts());
    q.readUserInput = jest.fn(() => { return '11:00' });
    expect(q.processResponse()).toBe(true);
});

test('processResponse sets property if valid', () => {
    let q = new SetupQuestion(getSettingOpts());
    q.readUserInput = jest.fn(() => { return '11:00' });
    expect(q.processResponse()).toBe(true);

    let setting = AppSetting.find(settingId);
    expect(setting.value).toEqual('11:00');
});

test('processResponse sets tag value if valid', () => {
    let q = new SetupQuestion(getTagOpts());
    q.readUserInput = jest.fn(() => { return 'Example Org' });
    expect(q.processResponse()).toBe(true);

    let profile = BagItProfile.find(profileId);
    let tag = profile.getTagsFromFile('bag-info.txt', 'Source-Organization')[0];
    expect(tag.getValue()).toEqual('Example Org');
});

test('getValidators() with no requirements', () => {
    let q = new SetupQuestion(barebonesOpts);
    expect(q.getValidators()).toEqual([]);
});

test('getValidators() with required', () => {
    let q = new SetupQuestion(barebonesOpts);
    q.validation = {
        required: true
    }
    let validators = q.getValidators();
    expect(validators.length).toEqual(1);
    expect(validators[0]('anyvalue')).toBe(true);
    expect(validators[0]('')).toBe(false);
    expect(validators[0](null)).toBe(false);
    expect(validators[0](undefined)).toBe(false);
});

test('getValidators() with required and pattern', () => {
    let q = new SetupQuestion(getSettingOpts());
    let validators = q.getValidators();
    expect(validators.length).toEqual(2);
    // Validator says pattern must match /^11:00$/
    expect(validators[1]('10:00')).toBe(false);
    expect(validators[1]('11:00')).toBe(true);
});

test('getValidators() with required and min', () => {
    let q = new SetupQuestion(getNumericOpts());
    q.validation.max = null;
    let validators = q.getValidators();
    expect(validators.length).toEqual(2);

    // Should set max internally to Number.MAX_SAFE_INTEGER
    // because it is not defined.
    expect(q.validation.max).toEqual(Number.MAX_SAFE_INTEGER);

    // First validator is the 'required' validator.
    expect(validators[0]('any value')).toBe(true);

    // Second validator is the range validator.
    // Min is 1 max is Number.MAX_SAFE_INTEGER
    expect(validators[1](0)).toBe(false);
    expect(validators[1](1)).toBe(true);
    expect(validators[1](1000)).toBe(true);
});

test('getValidators() with required and max', () => {
    let q = new SetupQuestion(getNumericOpts());
    q.validation.min = null;
    let validators = q.getValidators();
    expect(validators.length).toEqual(2);

    // Should set min internally to Number.MIN_SAFE_INTEGER
    // because it is not defined.
    expect(q.validation.min).toEqual(Number.MIN_SAFE_INTEGER);

    // First validator is the 'required' validator.
    expect(validators[0]('any value')).toBe(true);

    // Second validator is the range validator.
    // Min Number.MIN_SAFE_INTEGER, max is 10
    expect(validators[1](-1000)).toBe(true);
    expect(validators[1](1)).toBe(true);
    expect(validators[1](1000)).toBe(false);
});

test('getValidators() with required, min and max', () => {
    let q = new SetupQuestion(getNumericOpts());
    let validators = q.getValidators();
    expect(validators.length).toEqual(2);

    // First validator is the 'required' validator.
    expect(validators[0]('any value')).toBe(true);

    // Second validator is the range validator.
    expect(validators[1](-1000)).toBe(false);
    expect(validators[1](1)).toBe(true);
    expect(validators[1](5)).toBe(true);
    expect(validators[1](10)).toBe(true);
    expect(validators[1](1000)).toBe(false);
});

test('validate() with no requirements', () => {
    let q = new SetupQuestion(barebonesOpts);
    expect(q.validate()).toBe(true);
});

test('validate() with required and pattern', () => {
    let q = new SetupQuestion(barebonesOpts);
    q.validation = {
        required: true,
        pattern: 'RE_EMAIL'
    }

    q.value = null;
    expect(q.validate()).toBe(false);

    q.value = 'homer@example.com';
    expect(q.validate()).toBe(true);

    q.value = 'this is not an email address';
    expect(q.validate()).toBe(false);
});

test('validate() with required and min/max', () => {
    let q = new SetupQuestion(barebonesOpts);
    q.validation = {
        required: true,
        min: 1,
        max: 10
    }

    q.value = null;
    expect(q.validate()).toBe(false);

    q.value = 1;
    expect(q.validate()).toBe(true);

    q.value = 5;
    expect(q.validate()).toBe(true);

    q.value = 10;
    expect(q.validate()).toBe(true);

    q.value = 20;
    expect(q.validate()).toBe(false);

    q.value = 'this is not a number';
    expect(q.validate()).toBe(false);
});

test('looksLikeNumericValidation()', () => {
    let q = new SetupQuestion(barebonesOpts);
    q.validation = {
        min: 1,
        max: 10
    }

    expect(q.looksLikeNumericValidation()).toBe(true);

    q.validation.min = undefined;
    expect(q.looksLikeNumericValidation()).toBe(true);

    q.validation.max = undefined;
    expect(q.looksLikeNumericValidation()).toBe(false);

    q.validation.min = 42;
    expect(q.looksLikeNumericValidation()).toBe(true);
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
