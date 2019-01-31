const $ = require('jquery');
const { InternalSetting } = require('../../core/internal_setting');
const { InternalSettingController } = require('./internal_setting_controller');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const url = require('url');

const formFields = ['id', 'name', 'value', 'userCanDelete'];

const settingName = "Unit Test Setting";
const settingValue = "Principal Skinner";
const params = new url.URLSearchParams({
    name: settingName,
    value: settingValue
});


beforeEach(() => {
    TestUtil.deleteJsonFile('InternalSetting');
});

afterAll(() => {
    TestUtil.deleteJsonFile('InternalSetting');
});

function createInternalSetting(name, value) {
    let internalSetting = new InternalSetting({ name: name, value: value });
    internalSetting.save();
    return internalSetting;
}

function confirmHeading() {
    expect($('h2:contains("Internal Setting")').length).toEqual(1);
    expect($('form').length).toEqual(1);
}

test('Constructor sets expected properties', () => {
    let controller = new InternalSettingController(params);
    expect(controller.params).toEqual(params);
    expect(controller.navSection).toEqual("Settings");
    expect(controller.typeMap).toEqual({
        "limit": "number",
        "offset": "number",
        "userCanDelete": "boolean"
    });
    expect(controller.alertMessage).toBeNull();
});

test('list()', () => {
    let setting1 = createInternalSetting('Name 1', 'chocolate');
    let setting2 = createInternalSetting('Name 2', 'vanilla');
    let setting3 = createInternalSetting('Name 3', 'cherry');
    let setting4 = createInternalSetting('Name 4', 'caramel');
    let setting5 = createInternalSetting('Name 5', 'coffee');

    let listParams = new url.URLSearchParams({
        offset: 1,
        limit: 3,
        orderBy: 'name',
        sortDirection: 'desc'
    });
    let controller = new InternalSettingController(listParams);
    let response = controller.list();
    UITestUtil.setDocumentBody(response);

    expect($('td:contains(chocolate)').length).toEqual(0);
    expect($('td:contains(vanilla)').length).toEqual(1);
    expect($('td:contains(cherry)').length).toEqual(1);
    expect($('td:contains(caramel)').length).toEqual(1);
    expect($('td:contains(coffee)').length).toEqual(0);
});
