const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('../core/constants');
const { Job } = require('../core/job');
const path = require('path');
const { PluginManager } = require('../plugins/plugin_manager');
const { StorageService } = require('../core/storage_service');
const { TestUtil } = require('../core/test_util');
const { UploadOperation } = require('../core/upload_operation');
const { Workflow } = require('../core/workflow');

// The Job Id of the fixture at Job_001.json
let jobId = '3a8ab4fc-141e-494c-82a2-323c6f5dfe87';

// This will be populated by createStorageServices.
let storageServices = [];

const tarPluginId = '90110710-1ff9-4650-a086-d7b23772238f';

beforeAll(() => {
    saveBagItProfile();
    saveJob();
    createStorageServices();
});

afterAll(() => {
    TestUtil.deleteJsonFile('BagItProfile');
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('StorageService');
    TestUtil.deleteJsonFile('Workflow');
});

function saveBagItProfile() {
    TestUtil.loadProfilesFromSetup('aptrust')[0].save();
}

function saveJob() {
    let pathToFile = path.join(__dirname, '..', 'test', 'fixtures', 'Job_001.json');
    let job = Job.inflateFromFile(pathToFile);
    job.save();
}

function createStorageServices() {
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
}

let opts = {
    name: 'Test Workflow',
    description: 'Workflow for unit tests.',
    packageFormat: 'BagIt',
    packagePluginId: tarPluginId,
    bagItProfileId: Constants.BUILTIN_PROFILE_IDS['aptrust']
}

test('constructor()', () => {

});

// test('loadFromStdin() with Job JSON', () => {

// });

// test('loadFromStdin() with JobParams JSON', () => {

// });

// test('loadFromStdin() with valid JSON of bad object type', () => {

// });

// test('loadFromStdin() with invalid JSON', () => {

// });

// test('parseStdin() with valid JSON', () => {

// });

// test('parseStdin() with invalid JSON', () => {

// });

// test('looksLikeJob()', () => {

// });

// test('looksLikeJobParams()', () => {

// });

// test('loadJob() with Job JSON', () => {

// });

// test('loadJob() with JobParams JSON', () => {

// });

// test('loadJob() with valid Job UUID', () => {

// });

// test('loadJob() with invalid Job UUID', () => {

// });

// test('loadJob() with valid file path and good JSON', () => {

// });

// test('loadJob() with valid file path and bad JSON', () => {

// });

// test('loadJob() with invalid file path', () => {

// });
