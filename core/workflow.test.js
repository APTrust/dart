const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('./constants');
const { Job } = require('./job');
const path = require('path');
const { PluginManager } = require('../plugins/plugin_manager');
const { StorageService } = require('./storage_service');
const { TestUtil } = require('./test_util');
const { UploadOperation } = require('./upload_operation');
const { Workflow } = require('./workflow');

const tarPluginId = '90110710-1ff9-4650-a086-d7b23772238f';
let storageServices = [];

beforeAll(() => {
    TestUtil.loadFromProfilesDir('aptrust_2.2.json').save();
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

afterEach(() => {
    TestUtil.deleteJsonFile('Workflow');
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

test('save()', () => {
    let workflow = new Workflow({ name: 'Groundskeeper Willie'});
    workflow.save();

    let retrieved = Workflow.find(workflow.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.name).toEqual(workflow.name);
})

test('validate() ensures unique name', () => {
    let wf1 = new Workflow({ name: 'This name is taken' });
    expect(wf1.validate()).toBe(true);
    wf1.save();

    let wf2 = new Workflow({ name: 'This name is taken' });
    expect(wf2.validate()).toBe(false);
})

test('find by name', () => {
    let workflow = new Workflow({ name: 'Professor Frink' });
    workflow.save();
    let retrieved = Workflow.firstMatching('name', 'Professor Frink');
    expect(retrieved).toBeDefined();
    expect(retrieved.id).toEqual(workflow.id);
})

test('fromJob()', () => {
    let pathToFile = path.join(__dirname, '..', 'test', 'fixtures', 'Job_001.json');
    let job = Job.inflateFromFile(pathToFile);
    job.uploadOps.push(new UploadOperation('69b7877b-1ddc-41ee-bd4d-8c905884f2e1', []));
    let workflow = Workflow.fromJob(job);
    expect(workflow.name).toEqual('');
    expect(workflow.description).toEqual('');
    expect(workflow.packageFormat).toEqual('BagIt');
    expect(workflow.packagePluginId).toEqual('BagIt');
    expect(workflow.bagItProfileId).toEqual('24a1e6ac-f1f4-4ec5-b020-b97887e32284');
    expect(workflow.storageServiceIds).toEqual([
        'e712265a-45ee-41be-b3b0-c4a8c7929e00',
        '69b7877b-1ddc-41ee-bd4d-8c905884f2e1'
    ]);
})

test('fromJob() does not error if some job attributes are missing', () => {
    let job = new Job();
    job.packageOp = null;
    job.uploadOps = null;

    let workflow = Workflow.fromJob(job);
    expect(workflow.packageFormat).toEqual('None');
    expect(workflow.packagePluginId).toBeNull();
    expect(workflow.bagItProfileId).toBeNull();
    expect(workflow.storageServiceIds).toEqual([]);
});

test('findDuplicate() finds a duplicate Workflow, if it exists', () => {
    let workflow = new Workflow(opts);
    //let origWorkflowId = workflow.id;
    expect(workflow.findDuplicate()).toBeNull();
    workflow.save();

    let newWorkflow = new Workflow(opts);
    expect(newWorkflow.findDuplicate()).toEqual(workflow);
});

test('inflateFrom()', () => {
    let data = {
        name: 'Spongebob',
        description: 'Flip crabby patties at the Crusty Crab'
    };
    let workflow = Workflow.inflateFrom(data);
    expect(workflow).toBeTruthy();
    expect(workflow.constructor.name).toEqual('Workflow');
    expect(workflow.name).toEqual(data.name);
    expect(workflow.description).toEqual(data.description);
});

test('exportJson()', () => {
    let workflow = new Workflow(opts);
    let services = workflow.storageServices();

    let jsonData = workflow.exportJson();
    let data = JSON.parse(jsonData)

    // Exported JSON is not quite the same as the original
    // workflow object, so we can't do a direct comparison.
    // The exported JSON contains the full BagIt profile and
    // storage service records, not just their IDs.
    //
    // Tests ensure we got a BagItProfile object and StorageService
    // objects. (Not just IDs.)
    expect(data.bagItProfile).toMatchObject({
        bagItProfileInfo: expect.any(Object),
        tags: expect.any(Array)
    })
    expect(data.bagItProfile.tags.length).toEqual(14)

    expect(data.storageServices[0]).toMatchObject({
        name: 'SS 1',
        protocol: 's3',
    })
    expect(data.storageServices[1]).toMatchObject({
        name: 'SS 2',
        protocol: 'ftp',
    })
});
