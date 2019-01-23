const $ = require('jquery');
const { UploadTarget } = require('../../core/upload_target');
const { UploadTargetController } = require('./upload_target_controller');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const url = require('url');

const formFields = [
    'id', 'name', 'description', 'protocol', 'host',
    'port', 'bucket', 'login', 'password', 'loginExtra',
    'userCanDelete'];

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
    target.description = 'Test Description';
    target.host = 'example.com';
    target.protocol = '23a8f0af-a03a-418e-89a4-6d07799882b6';
    target.port = 999;
    target.bucket = 'root';
    target.login = 'jo@example.com';
    target.password = 'secret';
    target.loginExtra = '1234';
    target.save();
    return target;
}

function confirmHeading() {
    expect($('h2:contains("Upload Target")').length).toEqual(1);
    expect($('form').length).toEqual(1);
}

function confirmSaveButton() {
    let saveButton = $('a:contains("Save")').first();
    expect(saveButton).toBeDefined();
    expect(saveButton.attr('href')).toContain('#UploadTarget/update');
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

test('new()', () => {
    let controller = new UploadTargetController();
    let response = controller.new();
    UITestUtil.setDocumentBody(response);
    let navLinkClass = UITestUtil.getNavItemCssClass("Settings");
    expect(navLinkClass).toContain('active');

    confirmHeading();
    confirmSaveButton();

    for(let field of formFields) {
        let selector = `#uploadTargetForm_${field}`;
        expect($(selector).length).toEqual(1);
    }
});

test('edit()', () => {
    let target = createTarget(targetName);
    let idParams = new url.URLSearchParams({ id: target.id });
    let controller = new UploadTargetController(idParams);
    let response = controller.edit();
    UITestUtil.setDocumentBody(response);

    confirmHeading();
    confirmSaveButton();

    for(let field of formFields) {
        let selector = `#uploadTargetForm_${field}`;
        expect($(selector).val()).toEqual(target[field].toString());
    }
});

test('update()', () => {
    let target = createTarget(targetName);
    let idParams = new url.URLSearchParams({ id: target.id });
    let controller = new UploadTargetController(idParams);

    // Set up the form.
    let response = controller.edit();
    UITestUtil.setDocumentBody(response);

    // Change the form values.
    for(let field of formFields) {
        let selector = `#uploadTargetForm_${field}`;
        if (field == 'port') {
            $(selector).val('1234');
        } else if (!['id', 'userCanDelete', 'protocol'].includes(field)) {
            $(selector).val('new.value');
        }
    }

    // Submit form to controller.
    response = controller.update();

    // Make sure values were saved to DB.
    target = UploadTarget.find(target.id);
    for(let field of formFields) {
        if (field == 'port') {
            expect(target[field]).toEqual(1234);
        } else if (!['id', 'userCanDelete', 'protocol'].includes(field)) {
            expect(target[field]).toEqual('new.value');
        }
    }
});

test('list()', () => {
    let target1 = createTarget('Name 1');
    let target2 = createTarget('Name 2');
    let target3 = createTarget('Name 3');
    let target4 = createTarget('Name 4');
    let target5 = createTarget('Name 5');

    let listParams = new url.URLSearchParams({
        offset: 1,
        limit: 3,
        orderBy: 'name',
        sortDirection: 'desc'
    });
    let controller = new UploadTargetController(listParams);
    let response = controller.list();
    UITestUtil.setDocumentBody(response);

    expect($('td:contains(Name 1)').length).toEqual(0);
    expect($('td:contains(Name 2)').length).toEqual(1);
    expect($('td:contains(Name 3)').length).toEqual(1);
    expect($('td:contains(Name 4)').length).toEqual(1);
    expect($('td:contains(Name 5)').length).toEqual(0);
});

test('destroy() deletes the object when you say yes', () => {

    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true)

    let target = createTarget(targetName);
    let idParams = new url.URLSearchParams({ id: target.id });
    let controller = new UploadTargetController(idParams);

    expect(UploadTarget.find(target.id)).toBeDefined();

    let deleteResponse = controller.destroy();
    expect(UploadTarget.find(target.id)).not.toBeDefined();

    // Confirm that destroy returns the user to the list.
    let listResponse = controller.list();
    expect(deleteResponse).toEqual(listResponse);
});

test('destroy() does not delete the object when you say no', () => {

    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false)

    let target = createTarget(targetName);
    let idParams = new url.URLSearchParams({ id: target.id });
    let controller = new UploadTargetController(idParams);

    expect(UploadTarget.find(target.id)).toBeDefined();

    let deleteResponse = controller.destroy();

    // Object should still be there.
    expect(UploadTarget.find(target.id)).toBeDefined();

    // And the response should be empty.
    expect(deleteResponse).toEqual({});
});
