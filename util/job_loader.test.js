const { AppSetting } = require('../core/app_setting');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { Job } = require('../core/job');
const { JobLoader } = require('./job_loader');
const { JobParams } = require('../core/job_params');
const path = require('path');
const { StorageService } = require('../core/storage_service');
const { TestUtil } = require('../core/test_util');
const { Util } = require('../core/util');
const { Workflow } = require('../core/workflow');

// The Job Id of the fixture at Job_001.json
const jobId = '3a8ab4fc-141e-494c-82a2-323c6f5dfe87';
const tarPluginId = '90110710-1ff9-4650-a086-d7b23772238f';

beforeAll(() => {
    TestUtil.loadFixtures('AppSetting_DevNull', AppSetting, true);
    TestUtil.loadFromProfilesDir('aptrust_2.2.json').save();
    TestUtil.loadFixtures('Job_001', Job, true);
    TestUtil.loadFixtures(['StorageService_001', 'StorageService_002'], StorageService, true);
    TestUtil.loadFixtures('Workflow_001', Workflow, true);
});

afterAll(() => {
    TestUtil.deleteJsonFile('AppSetting');
    TestUtil.deleteJsonFile('BagItProfile');
    TestUtil.deleteJsonFile('Job');
    TestUtil.deleteJsonFile('StorageService');
    TestUtil.deleteJsonFile('Workflow');
});

let opts = {
    name: 'Test Workflow',
    description: 'Workflow for unit tests.',
    packageFormat: 'BagIt',
    packagePluginId: tarPluginId,
    bagItProfileId: Constants.BUILTIN_PROFILE_IDS['aptrust']
}

let dummyOpts = {
    opt1: 'opt one',
    opt2: 'opt two'
}

test('constructor()', () => {
    let json = '{ "key": "value"}';
    let jobLoader = new JobLoader(dummyOpts, json);
    expect(jobLoader.opts).toEqual(dummyOpts);
    expect(jobLoader.json).toEqual(json);
});

test('_loadFromJson() with Job JSON', () => {
    let job = Job.find(jobId);
    let json = JSON.stringify(job);
    let jobLoader = new JobLoader(dummyOpts, json);
    let loadedJob = jobLoader._loadFromJson();
    expect(loadedJob).toBeTruthy();
    expect(loadedJob.constructor.name).toEqual('Job');
    expect(loadedJob.id).toEqual(job.id);
});

test('_loadFromJson() with JobParams JSON', () => {
    let jobParams = TestUtil.loadFixtures('JobParams_001', JobParams)[0];
    let json = JSON.stringify(jobParams);
    let jobLoader = new JobLoader(dummyOpts, json);

    // This should load the Workflow called 'Test Workflow'
    // and create a job from it. The underlying code that
    // converts JobParams to Job is tested more thoroughly
    // in job_params.test.js.
    let loadedJob = jobLoader._loadFromJson();
    expect(loadedJob).toBeTruthy();
    expect(loadedJob.constructor.name).toEqual('Job');
    expect(Util.looksLikeUUID(loadedJob.id)).toBe(true);
    expect(loadedJob.bagItProfile).not.toBeNull();
    expect(loadedJob.bagItProfile.id).toEqual(opts.bagItProfileId);
    expect(loadedJob.packageOp.packageFormat).toEqual(opts.packageFormat);
    expect(loadedJob.packageOp.pluginId).toEqual(opts.packagePluginId);
    expect(loadedJob.packageOp.sourceFiles).toEqual(['file1', 'file2']);
});

test('_loadFromJson() throws error if Workflow does not exist', () => {
    let jobParams = TestUtil.loadFixtures('JobParams_001', JobParams)[0];
    jobParams.workflowName = 'This workflow does not exist';
    let json = JSON.stringify(jobParams);
    let jobLoader = new JobLoader(dummyOpts, json);
    expect(function() {
        jobLoader._loadFromJson();
    }).toThrow('Error creating job.\nworkflow: Cannot find workflow This workflow does not exist');
});

test('_loadFromJson() with valid JSON of bad object type', () => {
    let json = '{"one": 1, "two": 2}';
    let jobLoader = new JobLoader(dummyOpts, json);
    expect(function() {
        jobLoader._loadFromJson();
    }).toThrow(Context.y18n.__("JSON data does not look like a job or a workflow."));
});

test('_loadFromJson() with invalid JSON', () => {
    let json = "This isn't even JSON";
    let jobLoader = new JobLoader(dummyOpts, json);
    expect(function() {
        jobLoader._loadFromJson();
    }).toThrow(Context.y18n.__("Error parsing JSON"));
});

test('looksLikeJob()', () => {
    let job = Job.find(jobId);
    let json = JSON.stringify(job);
    let jobLoader = new JobLoader(dummyOpts, json);

    // A data structure that looks like a Job
    let data1 = JSON.parse(json);
    expect(jobLoader.looksLikeJob(data1)).toBe(true);

    // A data structure that does not look like a job
    let jobParams = TestUtil.loadFixtures('JobParams_001', JobParams)[0];
    let data2 = JSON.parse(JSON.stringify(jobParams));
    expect(jobLoader.looksLikeJob(data2)).toBe(false);
});

test('looksLikeJobParams()', () => {
    let job = Job.find(jobId);
    let json = JSON.stringify(job);
    let jobLoader = new JobLoader(dummyOpts, json);

    // A data structure that looks like a Job
    let data1 = JSON.parse(json);
    expect(jobLoader.looksLikeJobParams(data1)).toBe(false);

    // A data structure that does not look like a job
    let jobParams = TestUtil.loadFixtures('JobParams_001', JobParams)[0];
    let data2 = JSON.parse(JSON.stringify(jobParams));
    expect(jobLoader.looksLikeJobParams(data2)).toBe(true);
});

test('loadJob() with Job JSON', () => {
    let job = Job.find(jobId);
    let json = JSON.stringify(job);
    let jobLoader = new JobLoader(dummyOpts, json);
    let loadedJob = jobLoader.loadJob();
    expect(loadedJob).toBeTruthy();
    expect(loadedJob.constructor.name).toEqual('Job');
    expect(loadedJob.id).toEqual(job.id);
});

test('loadJob() with JobParams JSON', () => {
    let jobParams = TestUtil.loadFixtures('JobParams_001', JobParams)[0];
    let json = JSON.stringify(jobParams);
    let jobLoader = new JobLoader(dummyOpts, json);
    let loadedJob = jobLoader.loadJob();
    expect(loadedJob).toBeTruthy();
    expect(loadedJob.constructor.name).toEqual('Job');
    expect(Util.looksLikeUUID(loadedJob.id)).toBe(true);
    expect(loadedJob.bagItProfile).not.toBeNull();
    expect(loadedJob.bagItProfile.id).toEqual(opts.bagItProfileId);
    expect(loadedJob.packageOp.packageFormat).toEqual(opts.packageFormat);
    expect(loadedJob.packageOp.pluginId).toEqual(opts.packagePluginId);
    expect(loadedJob.packageOp.sourceFiles).toEqual(['file1', 'file2']);
});

test('loadJob() with valid Job UUID', () => {
    // Here we have no stdin data, but a uuid in opts.job
    let jobLoader = new JobLoader({ job: jobId }, null);
    let loadedJob = jobLoader.loadJob();
    expect(loadedJob).toBeTruthy();
    expect(loadedJob.constructor.name).toEqual('Job');
    expect(loadedJob.id).toEqual(jobId);
});

test('loadJob() with invalid Job UUID', () => {
    let jobLoader = new JobLoader({ job: '2bcd621d-d6d7-494f-8846-0b97e302dc9c' });
    expect(function() {
        jobLoader.loadJob();
    }).toThrow(Context.y18n.__('Cannot find job with id'));
});

test('loadJob() with valid file path and valid Job JSON', () => {
    let pathToFile = path.join(__dirname, '..', 'test', 'fixtures', 'Job_001.json');
    let jobLoader = new JobLoader({ job: pathToFile });
    let loadedJob = jobLoader.loadJob();
    expect(loadedJob).toBeTruthy();
    expect(loadedJob.constructor.name).toEqual('Job');
    expect(loadedJob.id).toEqual(jobId);
});

test('loadJob() with valid file path and valid JobParams JSON', () => {
    // Write a JobParams file...
    let jobParams = TestUtil.loadFixtures('JobParams_001', JobParams)[0];
    let tmpFile = Util.tmpFilePath();
    fs.writeFileSync(tmpFile, JSON.stringify(jobParams));

    // Make sure JobLoader loads it and converts it to a job.
    let jobLoader = new JobLoader({ job: tmpFile });
    let loadedJob = jobLoader.loadJob();
    expect(loadedJob).toBeTruthy();
    expect(loadedJob.constructor.name).toEqual('Job');
    expect(Util.looksLikeUUID(loadedJob.id)).toBe(true);
});

test('loadJob() with valid file path and bad JSON', () => {
    let jobLoader = new JobLoader({ job: __filename });
    expect(function() {
        jobLoader.loadJob();
    }).toThrow(Context.y18n.__('Error parsing JSON from'));
});

test('loadJob() with invalid file path', () => {
    let jobLoader = new JobLoader({ job: "this/file/does/not/exist-09876" });
    expect(function() {
        jobLoader.loadJob();
    }).toThrow(Context.y18n.__('Job file does not exist'));
});

test('loadJob() throws meaningful error if there is nothing to load', () => {
    let jobLoader = new JobLoader();
    expect(function() {
        jobLoader.loadJob();
    }).toThrow(Context.y18n.__('You must specify either'));
});
