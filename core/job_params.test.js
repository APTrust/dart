const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const { JobParams } = require('./job_params');
const os = require('os');
const path = require('path');
const { StorageService } = require('./storage_service');
const { TestUtil } = require('./test_util');
const { Workflow } = require('./workflow');

beforeAll(() => {
    // Save the underlying objects we'll need to convert
    // JobParam objects into Jobs.
    saveBaggingDirSetting();
    saveStorageServices();
    saveBagItProfile();
    saveWorkflows();
});

afterAll(() => {
    TestUtil.deleteJsonFile('AppSetting');
    TestUtil.deleteJsonFile('BagItProfile');
    TestUtil.deleteJsonFile('StorageService');
    TestUtil.deleteJsonFile('Workflow');
});

const TarWriterPluginId = "90110710-1ff9-4650-a086-d7b23772238f";
const BagItProfileId = "28f48fcc-064d-4acf-bb5b-ea6ad5c6264d";

function saveStorageServices() {
    new StorageService({ name: 'Service 1'}).save();
    new StorageService({ name: 'Service 2'}).save();
    new StorageService({ name: 'Service 3'}).save();
}

function saveBagItProfile() {
    let profile = BagItProfile.load(path.join(__dirname, '..', 'test', 'profiles', 'multi_manifest.json'));
    profile.save();
}

function saveWorkflows() {
    new Workflow({
        name: "BagIt Package, No Uploads",
        description: "Includes BagIt packaging but no uploads",
        packageFormat: "BagIt",
        packagePluginId: TarWriterPluginId,
        bagItProfileId: BagItProfileId
    }).save();
    new Workflow({
        name: "Tar Package, No Uploads",
        description: "Includes tar packaging but no uploads",
        packageFormat: ".tar",
        packagePluginId: TarWriterPluginId
    }).save();
    new Workflow({
        name: "BagIt Package, With Uploads",
        description: "Includes BagIt packaging and three uploads",
        packageFormat: "BagIt",
        packagePluginId: TarWriterPluginId,
        bagItProfileId: BagItProfileId,
        storageServiceIds: [
            StorageService.firstMatching('name', 'Service 1').id,
            StorageService.firstMatching('name', 'Service 2').id,
            StorageService.firstMatching('name', 'Service 3').id
        ]
    }).save();
    new Workflow({
        name: "No Package, With Uploads",
        description: "Includes no packaging, with three uploads",
        packageFormat: "None",
        storageServiceIds: [
            StorageService.firstMatching('name', 'Service 1').id,
            StorageService.firstMatching('name', 'Service 2').id,
            StorageService.firstMatching('name', 'Service 3').id
        ]
    }).save();
}

function saveBaggingDirSetting() {
    new AppSetting({
        name: "Bagging Directory",
        value: path.join(os.homedir(), '.dart', 'bags')
    }).save();
}

test('Constructor sets expected properties', () => {

});

// test('_getOutputPath()', () => {

// });

// test('_getWorkflow()', () => {

// });

// test('_getBagItProfile()', () => {

// });

// test('_makePackageOp()', () => {

// });

// test('_makeUploadOps()', () => {

// });

// test('_groupedTags()', () => {

// });

// test('_mergeTagSet()', () => {

// });

// test('_mergeTags()', () => {

// });

// test('validate()', () => {

// });

// test('_buildJob()', () => {

// });

// test('toJob with BagIt packaging, no upload', () => {

// });

// test('toJob with tar packaging, no upload', () => {

// });

// test('toJob with uploads, no packaging', () => {

// });

// test('toJob with BagIt packaging and uploads', () => {

// });

// test('toJobFile()', () => {

// });
