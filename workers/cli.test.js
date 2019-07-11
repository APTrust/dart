const { AppSetting } = require('../core/app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { fork } = require('child_process');
const { Job } = require('../core/job');
const { JobParams } = require('../core/job_params');
const os = require('os');
const { PackageOperation } = require('../core/package_operation');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const { Workflow } = require('../core/workflow');

// TODO: Fixtures for the a runnable job and runnable workflow

// TODO: Move the Job fork code to a Util class that ensures
// the spawned job's DartProcess is added to Context.childProcesses

let jobId = null;
let workflow = null;
const bagItProfileId = '28f48fcc-064d-4acf-bb5b-ea6ad5c6264d';
const tarPluginId = '90110710-1ff9-4650-a086-d7b23772238f';

beforeAll(() => {
    setBaggingDir();
    saveBagItProfile();
    jobId = saveRunnableJob();
    createRunnableWorkflow();
});

afterAll(() => {
    TestUtil.deleteJsonFile('AppSetting');
    TestUtil.deleteJsonFile('BagItProfile');
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('Workflow');
});

function setBaggingDir() {
    new AppSetting({
        name: 'Bagging Directory',
        value: os.tmpdir()
    }).save();
}

function saveBagItProfile() {
    let profile = BagItProfile.load(path.join(__dirname, '..', 'test', 'profiles', 'multi_manifest.json'));
    profile.save();
}

function saveRunnableJob() {
    let outputDir = AppSetting.list()[0].value;
    let outputPath = path.join(outputDir, 'CLI_Test_Bag.tar');
    let bagItProfile = BagItProfile.find(bagItProfileId);
    setTag(bagItProfile, 'Source-Organization', 'Test University');
    setTag(bagItProfile, 'Title', 'CLI Test Bag');
    setTag(bagItProfile, 'Access', 'Institution');
    setTag(bagItProfile, 'Storage-Option', 'Standard');
    let packageOp = new PackageOperation('CLI_Test_Bag', outputPath);
    packageOp.packageFormat = 'BagIt';
    packageOp.pluginId = 'BagIt';
    packageOp.sourceFiles = [ __dirname ];
    let job = new Job({
        bagItProfile: bagItProfile,
        packageOp: packageOp
    });
    job.save();
    return job.id;
}

function setTag(profile, name, value) {
    profile.firstMatchingTag('tagName', name).userValue = value;
}

// This creates a runnable workflow and assigns it to the package-level
// var workflow.
function createRunnableWorkflow() {
    workflow = new Workflow({
	    name: "CLI Test Workflow",
	    description: "Includes BagIt packaging but no uploads",
	    packageFormat: "BagIt",
	    packagePluginId: tarPluginId,
	    bagItProfileId: bagItProfileId,
	    storageServiceIds: []
    });
}

// // Need to change npm command outside of dev env.
// let modulePath = path.join(__dirname, '..', '..', 'main.js');
// this.childProcess = fork(
//     modulePath,
//     ['--job', tmpFile, '--deleteJobFile']
// );


test('...', () => {
    expect(1).toEqual(1);
});

// test('Run job by UUID', () => {

// });

// test('Run job from Job JSON file', () => {

// });

// test('Run job from JobParams JSON file', () => {

// });

// test('Run job from Job JSON passed through STDIN', () => {

// });

// test('Run job from JobParams JSON passed through STDIN', () => {

// });
