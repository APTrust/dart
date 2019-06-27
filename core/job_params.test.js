const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const { Job } = require('./job');
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
const OutputDir = path.join(os.homedir(), '.dart', 'bags');
const BagsPath = path.join(__dirname, '..', 'test', 'bags');
const FixturesPath = path.join(__dirname, '..', 'test', 'fixtures');
const ProfilesPath = path.join(__dirname, '..', 'test', 'profiles');

var files = [ BagsPath, FixturesPath, ProfilesPath ];

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
        value: OutputDir
    }).save();
}

// Return a hash that we can alter per test without changes
// affecting all tests. These tags will be used in constructing
// JobParams objects.
function getTags() {
    return [
        {
	        "tagFile": "bag-info.txt",
	        "tagName": "Bag-Group-Identifier",
	        "userValue": "Photos_2019"
        },
        {
	        "tagFile": "aptrust-info.txt",
	        "tagName": "Title",
	        "userValue": "Photos from 2019"
        },
        {
	        "tagFile": "aptrust-info.txt",
	        "tagName": "Description",
	        "userValue": "What I did with my summer vacation."
        },
        {
	        "tagFile": "custom/legal-info.txt",
	        "tagName": "License",
	        "userValue": "https://creativecommons.org/publicdomain/zero/1.0/"
        }
    ]
}

function getJobParams(nameOfWorkflow, packageName) {
    return new JobParams({
        workflow: nameOfWorkflow,
        packageName: packageName,
        files: files,
        tags: getTags()
    });
}

test('Constructor sets expected properties', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    expect(jobParams.workflow).toEqual("BagIt Package, With Uploads");
    expect(jobParams.packageName).toEqual("Bag1.tar");
    expect(jobParams.files).toEqual(files);
    expect(jobParams.tags).toEqual(getTags());
});

test('_getOutputPath()', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    let actual = jobParams._getOutputPath();
    let expected = path.join(os.homedir(), '.dart', 'bags', "Bag1.tar");
    expect(actual).toEqual(expected);
});

test('_loadWorkflow()', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    let gotWorkflow = jobParams._loadWorkflow();
    expect(gotWorkflow).toBe(true);
    expect(jobParams._workflowObj.name).toEqual("BagIt Package, With Uploads");
});

test('_loadBagItProfile()', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    let gotProfile = jobParams._loadBagItProfile();
    expect(gotProfile).toBe(true);
    expect(jobParams._bagItProfile.name).toEqual("APTrust");
});

test('_makePackageOp() creates BagIt packageOp', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    jobParams._loadWorkflow();
    jobParams._loadBagItProfile();
    let job = new Job();
    jobParams._makePackageOp(job);

    expect(job.packageOp).toBeDefined();
    expect(job.packageOp.packageName).toEqual('Bag1.tar');
    expect(job.packageOp.outputPath).toEqual(path.join(OutputDir, 'Bag1.tar'));
    expect(job.packageOp.packageFormat).toEqual('BagIt');
    expect(job.packageOp.pluginId).toEqual(TarWriterPluginId);
    expect(job.packageOp.sourceFiles).toEqual(files);
});

test('_makePackageOp() creates tar packageOp', () => {
    let jobParams = getJobParams("Tar Package, No Uploads", "Bag1.tar");
    jobParams._loadWorkflow();
    jobParams._loadBagItProfile();
    let job = new Job();
    jobParams._makePackageOp(job);

    expect(job.packageOp).toBeDefined();
    expect(job.packageOp.packageName).toEqual('Bag1.tar');
    expect(job.packageOp.outputPath).toEqual(path.join(OutputDir, 'Bag1.tar'));
    expect(job.packageOp.packageFormat).toEqual('.tar');
    expect(job.packageOp.pluginId).toEqual(TarWriterPluginId);
    expect(job.packageOp.sourceFiles).toEqual(files);
});

test('_makePackageOp() creates no packageOp when there is no package step', () => {
    let jobParams = getJobParams("No Package, With Uploads");
    jobParams._loadWorkflow();
    jobParams._loadBagItProfile();
    let job = new Job();
    jobParams._makePackageOp(job);
    expect(job.packageOp).toBeNull();
});

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
