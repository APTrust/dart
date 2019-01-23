const $ = require('jquery');
const { UploadTarget } = require('../../core/upload_target');
const { UploadTargetController } = require('./upload_target_controller');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const url = require('url');

const targetName = "Unit Test Target";
const params = new url.URLSearchParams({
    name: targetName,
});

beforeEach(() => {
    TestUtil.deleteJsonFile('UploadTarget');
});

afterAll(() => {
    TestUtil.deleteJsonFile('UploadTarget');
});

function createTarget(name) {
    let target = new UploadTarget(name);
    target.save();
    return target;
}

test('Constructor sets expected properties', () => {
    let controller = new UploadTargetController(params);
    expect(controller.params).toEqual(params);
    expect(controller.navSection).toEqual("Settings");
    expect(controller.typeMap).toEqual({
        "port": "number",
        "userCanDelete": "boolean"
    });
    expect(controller.alertMessage).toBeNull();
});
