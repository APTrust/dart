const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('./constants');
const { PluginManager } = require('../plugins/plugin_manager');
const { StorageService } = require('./storage_service');
const { TestUtil } = require('./test_util');
const { Workflow } = require('./workflow');

const tarPluginId = '90110710-1ff9-4650-a086-d7b23772238f';
let storageServices = [];

beforeAll(() => {
    TestUtil.loadProfilesFromSetup('aptrust')[0].save();
    storageServices.push(new StorageService({
        name: 'SS 1',
        protocol: 's3',
        host: 'example.com'
    }));
    storageServices.push(new StorageService({
        name: 'SS 2',
        protocol: 'ftp',
        host: 'aptrust.org'
    }));
    storageServices[0].save();
    storageServices[1].save();

    opts.storageServiceIds = storageServices.map(ss => ss.id);
});

afterAll(() => {
    TestUtil.deleteJsonFile('BagItProfile');
    TestUtil.deleteJsonFile('StorageService');
});

let opts = {
    name: 'Test Workflow',
    description: 'Workflow for unit tests.',
    packageFormat: 'BagIt',
    packagePluginId: tarPluginId,
    bagItProfileId: Constants.BUILTIN_PROFILE_IDS['aptrust']
}

test('Constructor sets expected properties', () => {
    let workflow = new Workflow(opts);
    expect(workflow.name).toEqual(opts.name);
    expect(workflow.description).toEqual(opts.description);
    expect(workflow.packageFormat).toEqual(opts.packageFormat);
    expect(workflow.packagePluginId).toEqual(opts.packagePluginId);
    expect(workflow.bagItProfileId).toEqual(opts.bagItProfileId);
    expect(workflow.storageServiceIds).toEqual(opts.storageServiceIds);
});

test('pacakgePlugin()', () => {
    let workflow = new Workflow(opts);
    let plugin = workflow.packagePlugin();
    expect(typeof plugin).toEqual('function');
    expect(plugin.description().name).toEqual('TarWriter');

    workflow.packagePluginId = null;
    plugin = workflow.packagePlugin();
    expect(plugin).toBeNull();
});

test('pacakgePluginName()', () => {
    let workflow = new Workflow(opts);
    expect(workflow.packagePluginName()).toEqual('TarWriter');

    workflow.packagePluginId = null;
    expect(workflow.packagePluginName()).toBeNull();
});

test('bagItProfile()', () => {
    let workflow = new Workflow(opts);
    let bagItProfile = workflow.bagItProfile();
    expect(typeof bagItProfile).toEqual('object');
    expect(bagItProfile.name).toEqual('APTrust');

    workflow.bagItProfileId = null;
    expect(workflow.bagItProfile()).toBeNull();
});

test('bagItProfileName()', () => {
    let workflow = new Workflow(opts);
    let bagItProfile = workflow.bagItProfile();
    expect(workflow.bagItProfileName()).toEqual('APTrust');

    workflow.bagItProfileId = null;
    expect(workflow.bagItProfileName()).toBeNull();
});

test('storageServices()', () => {
    let workflow = new Workflow(opts);
    let services = workflow.storageServices();

    expect(services.length).toEqual(2);
    expect(services[0].constructor.name).toEqual('StorageService');
    expect(services[0].name).toEqual('SS 1');
    expect(services[1].name).toEqual('SS 2');

    workflow.storageServiceIds = [];
    expect(workflow.storageServices().length).toEqual(0);
});

test('storageServiceNames()', () => {
    let workflow = new Workflow(opts);
    let names = workflow.storageServiceNames();

    expect(names.length).toEqual(2);
    expect(names[0]).toEqual('SS 1');
    expect(names[1]).toEqual('SS 2');

    workflow.storageServiceIds = [];
    expect(workflow.storageServiceNames().length).toEqual(0);
});
