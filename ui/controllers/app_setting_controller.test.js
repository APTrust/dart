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

function createAppSetting(name, value) {
    let appSetting = new AppSetting(name, value);
    appSetting.save();
    return appSetting;
}

test('Constructor sets expected properties', () => {
    let controller = new AppSettingController(params);
    expect(controller.params).toEqual(params);
    expect(controller.navSection).toEqual("Settings");
    expect(controller.typeMap).toEqual({
        "limit": "number",
        "offset": "number",
        "userCanDelete": "boolean"
    });
    expect(controller.alertMessage).toBeNull();
});

test('new()', () => {
    let controller = new AppSettingController();
    let response = controller.new();
    UITestUtil.setDocumentBody(response);
    let navLinkClass = UITestUtil.getNavItemCssClass("Settings");
    expect(navLinkClass).toContain('active');
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

test('edit()', () => {
    let appSetting = createAppSetting(settingName, settingValue);
    let idParams = new url.URLSearchParams({ id: appSetting.id });
    let controller = new AppSettingController(idParams);
    let response = controller.edit();
    UITestUtil.setDocumentBody(response);

    expect($('h2:contains("Application Setting")').length).toEqual(1);
    expect($('form').length).toEqual(1);

    expect($('#appSettingForm_name').val()).toEqual(appSetting.name);
    expect($('#appSettingForm_value').val()).toEqual(appSetting.value);
    expect($('#appSettingForm_userCanDelete').val()).toEqual(appSetting.userCanDelete.toString());
    expect($('#appSettingForm_id').val()).toEqual(appSetting.id);

    let saveButton = $('a:contains("Save")').first();
    expect(saveButton).toBeDefined();
    expect(saveButton.attr('href')).toContain('#AppSetting/update');
});

test('update()', () => {
    let appSetting = createAppSetting(settingName, settingValue);
    let idParams = new url.URLSearchParams({ id: appSetting.id });
    let controller = new AppSettingController(idParams);

    // Set up the form.
    let response = controller.edit();
    UITestUtil.setDocumentBody(response);

    // Change the form values.
    $('#appSettingForm_name').val('New Name');
    $('#appSettingForm_value').val('New Value');
    $('#appSettingForm_userCanDelete').val('false')

    // Submit form to controller.
    controller.update();

    // Make sure values were saved to DB.
    appSetting = AppSetting.find(appSetting.id);
    expect(appSetting.name).toEqual('New Name');
    expect(appSetting.value).toEqual('New Value');
    expect(appSetting.userCanDelete).toEqual(false);
});

test('list()', () => {
    let setting1 = createAppSetting('Name 1', 'chocolate');
    let setting2 = createAppSetting('Name 2', 'vanilla');
    let setting3 = createAppSetting('Name 3', 'cherry');
    let setting4 = createAppSetting('Name 4', 'caramel');
    let setting5 = createAppSetting('Name 5', 'coffee');

    let listParams = new url.URLSearchParams({
        offset: 1,
        limit: 3,
        orderBy: 'name',
        sortDirection: 'desc'
    });
    let controller = new AppSettingController(listParams);
    let response = controller.list();
    UITestUtil.setDocumentBody(response);

    expect($('td:contains(chocolate)').length).toEqual(0);
    expect($('td:contains(vanilla)').length).toEqual(1);
    expect($('td:contains(cherry)').length).toEqual(1);
    expect($('td:contains(caramel)').length).toEqual(1);
    expect($('td:contains(coffee)').length).toEqual(0);
});

test('destroy() deletes the object when you say yes', () => {

    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true)

    let appSetting = createAppSetting(settingName, settingValue);
    let idParams = new url.URLSearchParams({ id: appSetting.id });
    let controller = new AppSettingController(idParams);

    expect(AppSetting.find(appSetting.id)).toBeDefined();

    let deleteResponse = controller.destroy();
    expect(AppSetting.find(appSetting.id)).not.toBeDefined();

    // Confirm that destroy returns the user to the list.
    let listResponse = controller.list();
    expect(deleteResponse).toEqual(listResponse);
});

test('destroy() does not delete the object when you say no', () => {

    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false)

    let appSetting = createAppSetting(settingName, settingValue);
    let idParams = new url.URLSearchParams({ id: appSetting.id });
    let controller = new AppSettingController(idParams);

    expect(AppSetting.find(appSetting.id)).toBeDefined();

    let deleteResponse = controller.destroy();

    // Object should still be there.
    expect(AppSetting.find(appSetting.id)).toBeDefined();

    // And the response should be empty.
    expect(deleteResponse).toEqual({});
});
