const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const fs = require('fs');
const { Job } = require('./job');
const { JobParams } = require('./job_params');
const path = require('path');
const { StorageService } = require('./storage_service');
const { TestUtil } = require('./test_util');
const { Util } = require('./util');
const { Workflow } = require('./workflow');

beforeAll(() => {
    TestUtil.loadFixtures('AppSetting_DevNull', AppSetting, true);
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
const OutputDir = '/dev/null';
const BagsPath = path.join(__dirname, '..', 'test', 'bags');
const FixturesPath = path.join(__dirname, '..', 'test', 'fixtures');
const ProfilesPath = path.join(__dirname, '..', 'test', 'profiles');

const Files = [ BagsPath, FixturesPath, ProfilesPath ];
const GroupedTagKeys = [
    'bag-info.txt:Bag-Group-Identifier',
    'aptrust-info.txt:Title',
    'aptrust-info.txt:Description',
    'custom/legal-info.txt:License'
];

function saveStorageServices() {
    TestUtil.loadFixtures(
        ['StorageService_001', 'StorageService_002'],
        StorageService,
        true
    );
}

function saveBagItProfile() {
    let profile = BagItProfile.load(path.join(__dirname, '..', 'test', 'profiles', 'multi_manifest.json'));
    profile.save();
}

function saveWorkflows() {
    let workflows = [
        'Workflow_BagIt_NoUploads',
        'Workflow_BagIt_WithUploads',
        'Workflow_NoPackage_WithUploads',
        'Workflow_Tar_NoUploads',
    ];
    TestUtil.loadFixtures(workflows, Workflow, true);
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

function getTagsWithDuplicates() {
    let tags = getTags();
    tags.push({
	    "tagFile": "bag-info.txt",
	    "tagName": "Bag-Group-Identifier",
	    "userValue": "Photos_2018"
    });
    tags.push({
	    "tagFile": "bag-info.txt",
	    "tagName": "Bag-Group-Identifier",
	    "userValue": "Photos_2017"
    });
    tags.push({
	    "tagFile": "custom/legal-info.txt",
	    "tagName": "License",
	    "userValue": "https://opensource.org/licenses/MIT"
    });
    tags.push({
	    "tagFile": "custom/legal-info.txt",
	    "tagName": "License",
	    "userValue": "https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html"
    });
    return tags;
}

function getJobParams(nameOfWorkflow, packageName) {
    return new JobParams({
        workflowName: nameOfWorkflow,
        packageName: packageName,
        files: Files,
        tags: getTags()
    });
}

test('Constructor sets expected properties', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    expect(jobParams.workflowName).toEqual("BagIt Package, With Uploads");
    expect(jobParams.packageName).toEqual("Bag1.tar");
    expect(jobParams.files).toEqual(Files);
    expect(jobParams.tags).toEqual(getTags());
});

test('_getOutputPath()', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    let actual = jobParams._getOutputPath();
    let expected = path.join(OutputDir, "Bag1.tar");
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
    expect(job.packageOp.sourceFiles).toEqual(Files);
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
    expect(job.packageOp.sourceFiles).toEqual(Files);
});

test('_makePackageOp() creates no packageOp when there is no package step', () => {
    let jobParams = getJobParams("No Package, With Uploads");
    jobParams._loadWorkflow();
    jobParams._loadBagItProfile();
    let job = new Job();
    jobParams._makePackageOp(job);

    expect(job.packageOp).toBeDefined();
    expect(job.packageOp.packageFormat).toBeNull();
    expect(job.packageOp.pluginId).toBeNull();
    expect(job.packageOp.sourceFiles).toEqual([]);
});

test('_makeUploadOps() with 2 upload targets', () => {
    let jobParams = getJobParams("No Package, With Uploads");
    jobParams._loadWorkflow();
    let job = new Job();
    jobParams._makeUploadOps(job);

    expect(job.uploadOps.length).toEqual(2);
    for (let op of job.uploadOps) {
        expect(Util.looksLikeUUID(op.storageServiceId)).toBe(true);
        expect(op.sourceFiles).toEqual(Files);
    }
});

test('_makeUploadOps() with 0 upload targets', () => {
    let jobParams = getJobParams("Tar Package, No Uploads", "Bag1.tar");
    jobParams._loadWorkflow();
    let job = new Job();
    jobParams._makeUploadOps(job);

    expect(job.uploadOps.length).toEqual(0);
});

test('_groupedTags()', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    let groupedTags = jobParams._groupedTags();
    for (let key of GroupedTagKeys) {
        expect(groupedTags[key]).toBeDefined();
        expect(groupedTags[key].length).toEqual(1);
    }

    jobParams.tags = getTagsWithDuplicates();
    groupedTags = jobParams._groupedTags();
    for (let key of GroupedTagKeys) {
        expect(groupedTags[key]).toBeDefined();
    }

    expect(groupedTags['aptrust-info.txt:Title'].length).toEqual(1);
    expect(groupedTags['aptrust-info.txt:Description'].length).toEqual(1);

    // Make sure items are grouped and order is preserved.
    let tagSet1 = groupedTags['bag-info.txt:Bag-Group-Identifier'];
    expect(tagSet1.length).toEqual(3);
    expect(tagSet1[0].userValue).toEqual('Photos_2019');
    expect(tagSet1[1].userValue).toEqual('Photos_2018');
    expect(tagSet1[2].userValue).toEqual('Photos_2017');

    let tagSet2 = groupedTags['custom/legal-info.txt:License'];
    expect(tagSet2.length).toEqual(3);
    expect(tagSet2[0].userValue).toEqual('https://creativecommons.org/publicdomain/zero/1.0/');
    expect(tagSet2[1].userValue).toEqual('https://opensource.org/licenses/MIT');
    expect(tagSet2[2].userValue).toEqual('https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html');
});

test('_mergeTags() with single values', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    jobParams._loadWorkflow();
    jobParams._loadBagItProfile();
    expect(jobParams._bagItProfile).not.toBeNull();

    let job = new Job();
    job.bagItProfile = jobParams._bagItProfile;

    // Merging the tags should copy tag values from JobParams into
    // the Job's local copy of the BagItProfile.
    jobParams._mergeTags(job);

    let titleTags = job.bagItProfile.findMatchingTags('tagName', 'Title')
    expect(titleTags.length).toEqual(1);
    expect(titleTags[0].userValue).toEqual('Photos from 2019');

    let groupIdentifierTags = job.bagItProfile.findMatchingTags('tagName', 'Bag-Group-Identifier');
    expect(groupIdentifierTags.length).toEqual(1);
    expect(groupIdentifierTags[0].userValue).toEqual('Photos_2019');

    let descriptionTags = job.bagItProfile.findMatchingTags('tagName', 'Description');
    expect(descriptionTags.length).toEqual(1);
    expect(descriptionTags[0].userValue).toEqual('What I did with my summer vacation.');

    let licenseTags = job.bagItProfile.findMatchingTags('tagName', 'License');
    expect(licenseTags.length).toEqual(1);
    expect(licenseTags[0].userValue).toEqual('https://creativecommons.org/publicdomain/zero/1.0/');
});

test('_mergeTags() with multiple values', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    jobParams.tags = getTagsWithDuplicates();
    jobParams.tags.push({
	    "tagFile": "aptrust-info.txt",
	    "tagName": "Jenny-I-Got-Your-Number",
	    "userValue": "867-5309"
    });
    jobParams._loadWorkflow();
    jobParams._loadBagItProfile();
    expect(jobParams._bagItProfile).not.toBeNull();

    let job = new Job();
    job.bagItProfile = jobParams._bagItProfile;
    jobParams._mergeTags(job);


    let titleTags = job.bagItProfile.findMatchingTags('tagName', 'Title')
    expect(titleTags.length).toEqual(1);
    expect(titleTags[0].userValue).toEqual('Photos from 2019');

    let groupIdentifierTags = job.bagItProfile.findMatchingTags('tagName', 'Bag-Group-Identifier');
    expect(groupIdentifierTags.length).toEqual(3);
    expect(groupIdentifierTags[0].userValue).toEqual('Photos_2019');
    expect(groupIdentifierTags[1].userValue).toEqual('Photos_2018');
    expect(groupIdentifierTags[2].userValue).toEqual('Photos_2017');

    let descriptionTags = job.bagItProfile.findMatchingTags('tagName', 'Description');
    expect(descriptionTags.length).toEqual(1);
    expect(descriptionTags[0].userValue).toEqual('What I did with my summer vacation.');

    let licenseTags = job.bagItProfile.findMatchingTags('tagName', 'License');
    expect(licenseTags.length).toEqual(3);
    expect(licenseTags[0].userValue).toEqual('https://creativecommons.org/publicdomain/zero/1.0/');
    expect(licenseTags[1].userValue).toEqual('https://opensource.org/licenses/MIT');
    expect(licenseTags[2].userValue).toEqual('https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html');

    // Make sure new tag was added.
    let jennysNumber = job.bagItProfile.findMatchingTags('tagName', 'Jenny-I-Got-Your-Number')
    expect(jennysNumber.length).toEqual(1);
    expect(jennysNumber[0].userValue).toEqual('867-5309');
});

// test('validate()', () => {

// });

test('_buildJob()', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    jobParams.tags = getTagsWithDuplicates();
    jobParams._loadWorkflow();
    jobParams._loadBagItProfile();
    let job = jobParams._buildJob();
    expect(job).toBeDefined();
    expect(job).not.toBeNull();

    // Spot check. The tests above did a more thorough
    // inspection of the underlying methods and components.
    expect(job.packageOp.pluginId).toEqual(TarWriterPluginId);
    expect(job.workflowId).not.toBeNull();
    expect(Util.looksLikeUUID(job.workflowId)).toBe(true);
    expect(job.packageOp.outputPath).toMatch(/Bag1\.tar$/);
    expect(job.uploadOps.length).toEqual(2);
    expect(job.uploadOps[0].sourceFiles).toEqual([path.join(OutputDir, 'Bag1.tar')]);
    expect(job.bagItProfile.findMatchingTags('tagName', 'License').length).toEqual(3);
});


test('toJob() with BagIt packaging, no upload', () => {
    let jobParams = getJobParams("BagIt Package, No Uploads", "Bag1.tar");
    let job = jobParams.toJob();
    expect(job.workflowId).not.toBeNull();
    expect(Util.looksLikeUUID(job.workflowId)).toBe(true);
    expect(job.packageOp.pluginId).toEqual(TarWriterPluginId);
    expect(job.packageOp.outputPath).toMatch(/Bag1\.tar$/);
    expect(job.uploadOps.length).toEqual(0);
    expect(job.bagItProfile.findMatchingTags('tagName', 'License').length).toEqual(1);
});

test('toJob() with tar packaging, no upload', () => {
    let jobParams = getJobParams("Tar Package, No Uploads", "Bag1.tar");
    let job = jobParams.toJob();
    expect(job.packageOp.pluginId).toEqual(TarWriterPluginId);
    expect(job.packageOp.outputPath).toMatch(/Bag1\.tar$/);
    expect(job.uploadOps.length).toEqual(0);
    expect(job.workflowId).not.toBeNull();
    expect(Util.looksLikeUUID(job.workflowId)).toBe(true);
});

test('toJob() with uploads, no packaging', () => {
    let jobParams = getJobParams("No Package, With Uploads");
    let job = jobParams.toJob();
    expect(job).not.toBeNull();
    expect(job.packageOp.pluginId).toBeNull();
    expect(job.packageOp.outputPath).not.toBeDefined();
    expect(job.uploadOps.length).toEqual(2);

    // We're not packaging the files, just uploading them directly.
    expect(job.uploadOps[0].sourceFiles).toEqual(Files);
});

test('toJob() with BagIt packaging and uploads', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    let job = jobParams.toJob();
    expect(job).not.toBeNull();

    expect(job.packageOp.pluginId).toEqual(TarWriterPluginId);
    expect(job.packageOp.outputPath).toMatch(/Bag1\.tar$/);
    expect(job.uploadOps.length).toEqual(2);
    expect(job.uploadOps[0].sourceFiles).toEqual([path.join(OutputDir, 'Bag1.tar')]);
    expect(job.bagItProfile.findMatchingTags('tagName', 'License').length).toEqual(1);
});

test('toJob() returns null and sets error on missing Workflow', () => {
    let workflowName = "This workflow does not exist";
    let jobParams = getJobParams(workflowName);
    let job = jobParams.toJob();
    expect(job).toBeNull();
    expect(jobParams.errors['workflow']).toEqual(
        Context.y18n.__('Cannot find workflow %s', workflowName)
    );
});

test('toJob() returns null and sets error on missing BagItProfile', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    jobParams._loadWorkflow = jest.fn(() => {
        jobParams._workflowObj = { bagItProfileId: "00000000-0000-0000-0000-000000000000" }
        return true;
    });
    let job = jobParams.toJob();
    expect(job).toBeNull();
    expect(jobParams.errors['bagItProfile']).toEqual(
        Context.y18n.__("Could not find BagItProfile with id %s", "00000000-0000-0000-0000-000000000000")
    );
});


test('toJobFile()', () => {
    let jobParams = getJobParams("BagIt Package, With Uploads", "Bag1.tar");
    let tmpFile = Util.tmpFilePath();
    jobParams.toJobFile(tmpFile);
    expect(fs.existsSync(tmpFile)).toBe(true);

    let job = Job.inflateFromFile(tmpFile);

    expect(job).not.toBeNull();
    expect(job.packageOp.pluginId).toEqual(TarWriterPluginId);
    expect(job.packageOp.outputPath).toMatch(/Bag1\.tar$/);
    expect(job.uploadOps.length).toEqual(2);
    expect(job.uploadOps[0].sourceFiles).toEqual([path.join(OutputDir, 'Bag1.tar')]);
    expect(job.bagItProfile.findMatchingTags('tagName', 'License').length).toEqual(1);
});

test('inflateFrom()', () => {
    let data = {
        workflowName: 'Sample Workflow',
        packageName: 'BagOfPhotos',
        files: ['file1', 'file2']
    };
    let jobParams = JobParams.inflateFrom(data);
    expect(jobParams).toBeTruthy();
    expect(jobParams.constructor.name).toEqual('JobParams');
    expect(jobParams.workflowName).toEqual('Sample Workflow');
    expect(jobParams.packageName).toEqual('BagOfPhotos');
    expect(jobParams.files).toEqual(['file1', 'file2']);
});
