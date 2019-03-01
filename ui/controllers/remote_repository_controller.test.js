const $ = require('jquery');
const { PluginManager } = require('../../plugins/plugin_manager');
const { RemoteRepository } = require('../../core/remote_repository');
const { RemoteRepositoryController } = require('./remote_repository_controller');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');
const url = require('url');

const formFields = [
    'id', 'name', 'url', 'userId', 'apiToken',
    'loginExtra', 'pluginId', 'userCanDelete'];

let aptrustPlugin = PluginManager.getModuleCollection('Repository')[0];
const repoName = "Unit Test Repo";
const repoURL = "https://repo.example.org/api/v4";
const params = new url.URLSearchParams({
    name: repoName,
    url: repoURL
});

beforeEach(() => {
    TestUtil.deleteJsonFile('RemoteRepository');
});

afterAll(() => {
    TestUtil.deleteJsonFile('RemoteRepository');
});

function createRepo(name) {
    let repo = new RemoteRepository({ name: name });
    repo.url = repoURL;
    repo.userId = 'homer';
    repo.apiToken = 'simpson';
    repo.loginExtra = '1234';
    repo.pluginId = aptrustPlugin.description().id;
    repo.save();
    return repo;
}

function confirmHeading() {
    expect($('h2:contains("Remote Repository")').length).toEqual(1);
    expect($('form').length).toEqual(1);
}

function confirmSaveButton() {
    let saveButton = $('a:contains("Save")').first();
    expect(saveButton).toBeDefined();
    expect(saveButton.attr('href')).toContain('#RemoteRepository/update');
}

test('Constructor sets expected properties', () => {
    let controller = new RemoteRepositoryController(params);
    expect(controller.params).toEqual(params);
    expect(controller.navSection).toEqual("Settings");
    expect(controller.typeMap).toEqual({
        "userCanDelete": "boolean"
    });
    expect(controller.alertMessage).toBeNull();
});

test('new()', () => {
    let controller = new RemoteRepositoryController();
    let response = controller.new();
    UITestUtil.setDocumentBody(response);
    let navLinkClass = UITestUtil.getNavItemCssClass("Settings");
    expect(navLinkClass).toContain('active');

    confirmHeading();
    confirmSaveButton();

    for(let field of formFields) {
        let selector = `#remoteRepositoryForm_${field}`;
        expect($(selector).length).toEqual(1);
    }
});

test('edit()', () => {
    let target = createRepo(repoName);
    let idParams = new url.URLSearchParams({ id: target.id });
    let controller = new RemoteRepositoryController(idParams);
    let response = controller.edit();
    UITestUtil.setDocumentBody(response);

    confirmHeading();
    confirmSaveButton();

    for(let field of formFields) {
        let selector = `#remoteRepositoryForm_${field}`;
        expect($(selector).val()).toEqual(target[field].toString());
    }
});

test('update()', () => {
    let target = createRepo(repoName);
    let idParams = new url.URLSearchParams({ id: target.id });
    let controller = new RemoteRepositoryController(idParams);

    // Set up the form.
    let response = controller.edit();

    UITestUtil.setDocumentBody(response);

    // Change the form values.
    for(let field of formFields) {
        let selector = `#remoteRepositoryForm_${field}`;
        if (field === 'url') {
            $(selector).val('https://api.repo.kom');
        } else if (!['id', 'userCanDelete', 'pluginId'].includes(field)) {
            $(selector).val('new.value');
        }
    }

    // Submit form to controller.
    response = controller.update();

    // Make sure values were saved to DB.
    target = RemoteRepository.find(target.id);
    for(let field of formFields) {
        if (field === 'url') {
            expect(target[field]).toEqual('https://api.repo.kom');
        } else if (!['id', 'userCanDelete', 'pluginId'].includes(field)) {
            expect(target[field]).toEqual('new.value');
        }
    }
});

test('list()', () => {
    let target1 = createRepo('Name 1');
    let target2 = createRepo('Name 2');
    let target3 = createRepo('Name 3');
    let target4 = createRepo('Name 4');
    let target5 = createRepo('Name 5');

    let listParams = new url.URLSearchParams({
        offset: 1,
        limit: 3,
        orderBy: 'name',
        sortDirection: 'desc'
    });
    let controller = new RemoteRepositoryController(listParams);
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

    let target = createRepo(repoName);
    let idParams = new url.URLSearchParams({ id: target.id });
    let controller = new RemoteRepositoryController(idParams);

    expect(RemoteRepository.find(target.id)).toBeDefined();

    let deleteResponse = controller.destroy();
    expect(RemoteRepository.find(target.id)).not.toBeDefined();

    // Confirm that destroy returns the user to the list.
    let listResponse = controller.list();
    expect(deleteResponse).toEqual(listResponse);
});

test('destroy() does not delete the object when you say no', () => {

    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false)

    let target = createRepo(repoName);
    let idParams = new url.URLSearchParams({ id: target.id });
    let controller = new RemoteRepositoryController(idParams);

    expect(RemoteRepository.find(target.id)).toBeDefined();

    let deleteResponse = controller.destroy();

    // Object should still be there.
    expect(RemoteRepository.find(target.id)).toBeDefined();

    // And the response should be empty.
    expect(deleteResponse).toEqual({});
});
