const $ = require('jquery');
const { AppSetting } = require('../../core/app_setting');
const { AppSettingController } = require('./app_setting_controller');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const url = require('url');

// jest/jquery DOM: https://jestjs.io/docs/en/tutorial-jquery

const settingName = "Unit Test Setting";
const settingValue = "Principal Skinner";
const params = new url.URLSearchParams({
    name: settingName,
    value: settingValue
});


beforeEach(() => {
    TestUtil.deleteJsonFile('AppSetting');
});

afterAll(() => {
    TestUtil.deleteJsonFile('AppSetting');
});

function createAppSetting() {
    let appSetting = new AppSetting(settingName, settingValue);
    appSetting.save();
    return appSetting;
}

test('Constructor sets expected properties', () => {
    let controller = new AppSettingController(params);
    expect(controller.params).toEqual(params);
    expect(controller.navSection).toEqual("Settings");
    expect(controller.alertMessage).toBeNull();
});

test('new()', () => {
    let controller = new AppSettingController();
    let response = controller.new();
    UITestUtil.setDocumentBody(response);
    UITestUtil.assertActiveNavItem("Settings");
    expect($('h2:contains("Application Setting")').length).toEqual(1);
    expect($('form').length).toEqual(1);
    expect($('#appSettingForm_name').length).toEqual(1);
    expect($('#appSettingForm_value').length).toEqual(1);
    expect($('#appSettingForm_userCanDelete').length).toEqual(1);
    expect($('#appSettingForm_id').length).toEqual(1);
    let saveButton = $('a:contains("Save")').first();
    expect(saveButton).toBeDefined();
    expect(saveButton.attr('href')).toContain('#AppSetting/update');
});

// test('edit()', () => {
// });

// test('update()', () => {
// });

// test('list()', () => {
// });

// test('destroy()', () => {
// });
