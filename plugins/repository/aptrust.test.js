const APTrustClient = require('./aptrust');
const { PluginManager } = require('../plugin_manager');
const { RemoteRepository } = require('../../core/remote_repository');



const aptrustPluginId = 'c5a6b7db-5a5f-4ca5-a8f8-31b2e60c84bd';
const repo = new RemoteRepository({
    name: 'Test Repo',
    url: 'https://example.com',
    userId: 'marge@example.com',
    apiToken: '1234-5678',
    pluginId: aptrustPluginId
});



test('Constructor sets expected properties', () => {
    let client = new APTrustClient(repo);
    expect(client.repo).toEqual(repo);
    expect(client.objectsUrl).toEqual('https://example.com/member-api/v2/objects/?page=1&per_page=50&sort=date&state=A');
    expect(client.itemsUrl).toEqual('https://example.com/member-api/v2/items/?page=1&per_page=50&sort=date');
    expect(typeof client.objectsTemplate).toEqual('function');
    expect(typeof client.itemsTemplate).toEqual('function');
});

test('PluginManager can find this plugin', () => {
    expect(PluginManager.findById(aptrustPluginId)).toBeDefined();
});

test('description()', () => {
    let desc = APTrustClient.description();
    expect(desc.id).toEqual(aptrustPluginId);
    expect(desc.name).toEqual('APTrustClient');
    expect(desc.description.length).toBeGreaterThan(10);
    expect(desc.version).toBeDefined();
    expect(desc.talksToRepository.length).toEqual(1);
    expect(desc.talksToRepository[0]).toEqual('aptrust');
});

test('provides()', () => {
    let client = new APTrustClient(repo);
    let provides = client.provides();
    expect(provides.length).toEqual(2);
    expect(provides[0].title).toMatch(repo.name);
    expect(typeof provides[0].method).toEqual('function');
    expect(provides[1].title).toMatch(repo.name);
    expect(typeof provides[1].method).toEqual('function');
});

test('rencentIngests()', () => {
    let client = new APTrustClient(repo);
    client._doRequest = jest.fn((url, formatter) => {});
    client.recentIngests();
    expect(client._doRequest).toHaveBeenCalledWith(client.objectsUrl, expect.any(Function));
});

test('recentWorkItems()', () => {
    let client = new APTrustClient(repo);
    client._doRequest = jest.fn((url, formatter) => {});
    client.recentWorkItems();
    expect(client._doRequest).toHaveBeenCalledWith(client.itemsUrl, expect.any(Function));
});

test('_doRequest() returns content on success', done => {
    let client = new APTrustClient(repo);
    let onSuccess = (data) => { return data };
    let onError = (err) => { return err };
    let formatter = (data) => { return data; }
    client._request = jest.fn((url, onSuccess, onError) => {
        onSuccess('OK');
    });
    client._doRequest('http://example.com', formatter)
        .then(function(data) {
            expect(data).toEqual('OK');
            done();
        })
        .catch(function (err) {
            expect(err).not.toBeDefined();
            done();
        })
});

test('_doRequest() returns error message on error', done => {
    let client = new APTrustClient(repo);
    let onSuccess = (data) => { return data };
    let onError = (err) => { return err };
    let formatter = (data) => { return data; }
    client._request = jest.fn((url, onSuccess, onError) => {
        onError('ERROR');
    });
    client._doRequest('http://example.com', formatter)
        .then(function(data) {
            expect(data).not.toBeDefined();
            done();
        })
        .catch(function (err) {
            expect(err).toEqual('ERROR');
            done();
        })
});

test('hasRequiredConnectionInfo()', () => {
    let client = new APTrustClient(repo);
    expect(client.hasRequiredConnectionInfo()).toBe(true);

    let repo2 = new RemoteRepository();
    Object.assign(repo2, repo);
    repo2.userId = '';
    let client2 = new APTrustClient(repo2);
    expect(client2.hasRequiredConnectionInfo()).toBe(false);
});

test('_getHeaders()', () => {
    let expected =  {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "DART 2.0.6 / Node.js request",
        "X-Pharos-API-Key": "1234-5678",
        "X-Pharos-API-User": "marge@example.com",
    }
    let client = new APTrustClient(repo);
    expect(client._getHeaders()).toEqual(expected);
});
