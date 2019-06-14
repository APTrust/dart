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

// test('rencentIngests()', () => {

// });

// test('recentWorkItems()', () => {

// });

// test('_doRequest()', () => {

// });

// test('hasRequiredConnectionInfo()', () => {

// });

// test('_getHeaders()', () => {

// });

// test('_request()', () => {

// });
