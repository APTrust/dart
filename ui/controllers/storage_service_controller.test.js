const $ = require('jquery');
const { StorageService } = require('../../core/storage_service');
const { StorageServiceController } = require('./storage_service_controller');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const url = require('url');

const formFields = [
    'id', 'name', 'description', 'protocol', 'host',
    'port', 'bucket', 'login', 'password', 'loginExtra',
    'userCanDelete'];

const ssName = "Unit Test Storage Service";
const params = new url.URLSearchParams({
    name: ssName,
});

beforeEach(() => {
    TestUtil.deleteJsonFile('StorageService');
});

afterAll(() => {
    TestUtil.deleteJsonFile('StorageService');
});

function createStorageService(name) {
    let ss = new StorageService({ name: name });
    ss.description = 'Test Description';
    ss.host = 'example.com';
    ss.protocol = 's3';
    ss.port = 999;
    ss.bucket = 'root';
    ss.login = 'jo@example.com';
    ss.password = 'secret';
    ss.loginExtra = '1234';
    ss.save();
    return ss;
}

function confirmHeading() {
    expect($('h2:contains("Storage Service")').length).toEqual(1);
    expect($('form').length).toEqual(1);
}

function confirmSaveButton() {
    let saveButton = $('a:contains("Save")').first();
    expect(saveButton).toBeDefined();
    expect(saveButton.attr('href')).toContain('#StorageService/update');
}

test('Constructor sets expected properties', () => {
    let controller = new StorageServiceController(params);
    expect(controller.params).toEqual(params);
    expect(controller.navSection).toEqual("Settings");
    expect(controller.typeMap).toEqual({
        "port": "number",
        "userCanDelete": "boolean"
    });
    expect(controller.alertMessage).toBeNull();
});

test('new()', () => {
    let controller = new StorageServiceController();
    let response = controller.new();
    UITestUtil.setDocumentBody(response);
    let navLinkClass = UITestUtil.getNavItemCssClass("Settings");
    expect(navLinkClass).toContain('active');

    confirmHeading();
    confirmSaveButton();

    for(let field of formFields) {
        let selector = `#storageServiceForm_${field}`;
        expect($(selector).length).toEqual(1);
    }
});

test('edit()', () => {
    let ss = createStorageService(ssName);
    let idParams = new url.URLSearchParams({ id: ss.id });
    let controller = new StorageServiceController(idParams);
    let response = controller.edit();
    UITestUtil.setDocumentBody(response);

    confirmHeading();
    confirmSaveButton();

    for(let field of formFields) {
        let selector = `#storageServiceForm_${field}`;
        expect($(selector).val()).toEqual(ss[field].toString());
    }
});

test('update()', () => {
    let ss = createStorageService(ssName);
    let idParams = new url.URLSearchParams({ id: ss.id });
    let controller = new StorageServiceController(idParams);

    // Set up the form.
    let response = controller.edit();
    UITestUtil.setDocumentBody(response);

    // Change the form values.
    for(let field of formFields) {
        let selector = `#storageServiceForm_${field}`;
        if (field == 'port') {
            $(selector).val('1234');
        } else if (!['id', 'userCanDelete', 'protocol'].includes(field)) {
            $(selector).val('new.value');
        }
    }

    // Submit form to controller.
    response = controller.update();

    // Make sure values were saved to DB.
    ss = StorageService.find(ss.id);
    for(let field of formFields) {
        if (field == 'port') {
            expect(ss[field]).toEqual(1234);
        } else if (!['id', 'userCanDelete', 'protocol'].includes(field)) {
            expect(ss[field]).toEqual('new.value');
        }
    }
});

test('list()', () => {
    let ss1 = createStorageService('Name 1');
    let ss2 = createStorageService('Name 2');
    let ss3 = createStorageService('Name 3');
    let ss4 = createStorageService('Name 4');
    let ss5 = createStorageService('Name 5');

    let listParams = new url.URLSearchParams({
        offset: 1,
        limit: 3,
        orderBy: 'name',
        sortDirection: 'desc'
    });
    let controller = new StorageServiceController(listParams);
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

    let ss = createStorageService(ssName);
    let idParams = new url.URLSearchParams({ id: ss.id });
    let controller = new StorageServiceController(idParams);

    expect(StorageService.find(ss.id)).toBeDefined();

    let deleteResponse = controller.destroy();
    expect(StorageService.find(ss.id)).not.toBeDefined();

    // Confirm that destroy returns the user to the list.
    let listResponse = controller.list();
    expect(deleteResponse).toEqual(listResponse);
});

test('destroy() does not delete the object when you say no', () => {

    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false)

    let ss = createStorageService(ssName);
    let idParams = new url.URLSearchParams({ id: ss.id });
    let controller = new StorageServiceController(idParams);

    expect(StorageService.find(ss.id)).toBeDefined();

    let deleteResponse = controller.destroy();

    // Object should still be there.
    expect(StorageService.find(ss.id)).toBeDefined();

    // And the response should be empty.
    expect(deleteResponse).toEqual({});
});
