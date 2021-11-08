const { AppSetting } = require('../core/app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Constants } = require('../core/constants');
const { fork, spawn } = require('child_process');
const fs = require('fs');
const { Job } = require('../core/job');
const { JobParams } = require('../core/job_params');
const os = require('os');
const { PackageOperation } = require('../core/package_operation');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const { Workflow } = require('../core/workflow');

// Values for these three will be set below.
let jobId = null;
let workflow = null;
let outputPath = null;

const bagItProfileId = '28f48fcc-064d-4acf-bb5b-ea6ad5c6264d';
const tarPluginId = '90110710-1ff9-4650-a086-d7b23772238f';

beforeAll(() => {
    setBaggingDir();
    saveBagItProfile();
    jobId = saveRunnableJob();
    workflow = saveRunnableWorkflow();
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
    outputPath = path.join(outputDir, 'CLI_Test_Bag.tar');
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

function saveRunnableWorkflow() {
    let workflow = new Workflow({
	    name: "CLI Test Workflow",
	    description: "Includes BagIt packaging but no uploads",
	    packageFormat: "BagIt",
	    packagePluginId: tarPluginId,
	    bagItProfileId: bagItProfileId,
	    storageServiceIds: []
    });
    workflow.save();
    return workflow;
}

function createJobParams() {
    return new JobParams({
        workflowName: 'CLI Test Workflow',
        packageName: path.basename(outputPath),
        files: [ __dirname ],
        tags: [
  		    {
  			    "tagFile": "bag-info.txt",
  			    "tagName": "Bag-Group-Identifier",
  			    "userValue": "Photos_2019"
  		    },
  		    {
  			    "tagFile": "bag-info.txt",
  			    "tagName": "Source-Organization",
  			    "userValue": "Test University"
  		    },
  		    {
  			    "tagFile": "aptrust-info.txt",
  			    "tagName": "Title",
  			    "userValue": "Photos from 2019"
  		    },
  		    {
  			    "tagFile": "aptrust-info.txt",
  			    "tagName": "Storage-Option",
  			    "userValue": "Standard"
  		    },
  		    {
  			    "tagFile": "aptrust-info.txt",
  			    "tagName": "Access",
  			    "userValue": "Institution"
  		    }
        ]
    });
}

function forkProcess(param, stdinData) {
    let modulePath = path.join(__dirname, '..', 'main.js');
    let params = ['--job', param];
    if (stdinData) {
        params = ['--stdin'];
    }
    let proc = fork(
        modulePath,
        params,
        { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] }
    );
    proc.on('message', (data) => {
        console.log(data.toString());
    });
    proc.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    proc.stderr.on('error', function(data) {
        console.error(data.toString());
    });
    // When sending job json to the child process' stdin,
    // we have to wait till it's ready, or it reads only
    // the last N bytes of the input. Node processes do not
    // emit a 'started' or 'ready' event, so we have to
    // give it some time to load before sending data to stdin.
    // The load time below is a guess, and varies from system
    // to system. Not sure why fork returns a process that isn't
    // fully initialized. :(
    //
    // Adjust timeout for AppVeyor tests
    let timeout = os.platform() == 'win32' ? 200 : 1000;
    if (stdinData) {
        setTimeout(function() {
            proc.stdin.write(stdinData + "\n");
            proc.stdin.end();
        }, timeout)
    }
    expect(proc).toBeTruthy();
    return proc;
}

// Be safe about this. Don't delete anything outside the
// tmp dir.
function removeFile(filepath) {
    if (filepath.startsWith(os.tmpdir())&& fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
}

test('Run job by UUID', done => {
    // Pass in the job UUID as the command line arg.
    // The JobLoader should load the job from the DART Jobs DB.
    forkProcess(jobId).on('exit', function(exitCode){
        expect(exitCode).toEqual(Constants.EXIT_SUCCESS);
        expect(outputPath).toBeTruthy();
        expect(fs.existsSync(outputPath)).toBe(true);
        removeFile(outputPath);
        done();
    });
});

test('Run job from Job JSON file', done => {
    let job = Job.find(jobId);
    let jsonPath = path.join(os.tmpdir(), 'DART_CLI_Test_Job.json');
    fs.writeFileSync(jsonPath, JSON.stringify(job));

    // Pass in the path of the Job JSON file as arg.
    // The JobLoader should load the job from that file.
    forkProcess(jsonPath).on('exit', function(exitCode){
        expect(exitCode).toEqual(Constants.EXIT_SUCCESS);
        expect(outputPath).toBeTruthy();
        expect(fs.existsSync(outputPath)).toBe(true);
        removeFile(outputPath);
        removeFile(jsonPath);
        done();
    });
});

test('Run job from JobParams JSON file', done => {
    let jobParams = createJobParams();
    let jsonPath = path.join(os.tmpdir(), 'DART_CLI_Test_JobParams.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jobParams));

    // Pass in the path of the JobParams JSON file as arg.
    // The JobLoader should parse that file, assemble a Job
    // from it, and run the job.
    forkProcess(jsonPath).on('exit', function(exitCode){
        expect(exitCode).toEqual(Constants.EXIT_SUCCESS);
        expect(outputPath).toBeTruthy();
        expect(fs.existsSync(outputPath)).toBe(true);
        removeFile(outputPath);
        removeFile(jsonPath);
        done();
    });
});

test('Run job from Job JSON passed through STDIN', done => {
    let job = Job.find(jobId);
    let jobJson = JSON.stringify(job);
    forkProcess('', jobJson).on('exit', function(exitCode){
        expect(exitCode).toEqual(Constants.EXIT_SUCCESS);
        expect(outputPath).toBeTruthy();
        expect(fs.existsSync(outputPath)).toBe(true);
        removeFile(outputPath);
        done();
    });
});

test('Run job from JobParams JSON passed through STDIN', done => {
    let jobParams = createJobParams();
    let jsonData = JSON.stringify(jobParams);

    forkProcess(null, jsonData).on('exit', function(exitCode){
        expect(exitCode).toEqual(Constants.EXIT_SUCCESS);
        expect(outputPath).toBeTruthy();
        expect(fs.existsSync(outputPath)).toBe(true);
        removeFile(outputPath);
        done();
    });
});
