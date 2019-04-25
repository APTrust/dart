const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { Job } = require('../core/job');
const { JobRunner } = require('./job_runner');
const { OutputCatcher } = require('../util/output_catcher');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const { UploadOperation } = require('../core/upload_operation');
const { UploadTestHelper } = require('../util/upload_test_helper');
const { Util } = require('../core/util');

// Create a tarred bag here.
let tmpBagFile = Util.tmpFilePath() + ".tar";

// Save the job file here.
let tmpJobFile = Util.tmpFilePath() + ".json";

// Job Id from fixture Job_003.json, which we load below.
let jobId = "96d21b19-82ba-4de3-842c-ff961877e8de";

// Capture JobRunner output
let filterPattern = '{"op":';
let outputCatcher = new OutputCatcher(filterPattern);

let helper = new UploadTestHelper();

let skipMessagePrinted = false;

beforeEach(() => {
    outputCatcher.captureOutput();
    deleteTmpBagFile();
})

afterEach(() => {
    outputCatcher.relayJestOutput();
    deleteTmpBagFile();
})


function deleteTmpBagFile() {
    try { fs.unlinkSync(tmpBagFile); }
    catch (ex) { }
}

function writeJobFile() {
    let uploadTarget = helper.getUploadTarget();
    uploadTarget.save();
    let jobFile = path.join(__dirname, '..', 'test', 'fixtures', 'Job_003.json');
    let job = Job.inflateFromFile(jobFile);
    job.packageOp.outputPath = tmpBagFile;
    job.packageOp.sourceFiles = [
        path.join(__dirname, '..', 'test', 'fixtures'),
        path.join(__dirname, '..', 'test', 'profiles'),
        __filename
    ];

    if (helper.envHasS3Credentials()) {
        job.uploadOps = [
            new UploadOperation(uploadTarget.id, [tmpBagFile]),
            new UploadOperation(uploadTarget.id, [tmpBagFile])
        ];
    } else {
        job.uploadOps = [];
        if (!skipMessagePrinted) {
            console.log('Skipping upload portion of JobRunner test: no AWS credentials in environment.');
            skipMessagePrinted = true;
        }
    }
    fs.writeFileSync(tmpJobFile, JSON.stringify(job));
}

function checkBagCreatorResults(job, stats) {
    expect(job.packageOp.result).not.toBeNull();
    expect(job.packageOp.result.operation).toEqual('bagging');
    expect(job.packageOp.result.provider).toEqual('DART bagger');
    expect(job.packageOp.result.filepath).toEqual(tmpBagFile);
    expect(job.packageOp.result.filesize).toEqual(stats.size);
    expect(job.packageOp.result.attempt).toEqual(1);
    expect(job.packageOp.result.started).toMatch(TestUtil.ISODatePattern);
    expect(job.packageOp.result.completed).toMatch(TestUtil.ISODatePattern);
}

function checkValidatorResults(job) {
    expect(job.validationOp.result).not.toBeNull();
    expect(job.validationOp.result.operation).toEqual('validation');
    expect(job.validationOp.result.provider).toEqual('DART BagIt validator');
    expect(job.validationOp.result.filepath).toEqual(tmpBagFile);
    expect(job.validationOp.result.attempt).toEqual(1);
    expect(job.validationOp.result.started).toMatch(TestUtil.ISODatePattern);
    expect(job.validationOp.result.completed).toMatch(TestUtil.ISODatePattern);
}

function checkUploadResults(job) {
    for (let op of job.uploadOps) {
        // Can have multiple results because we may be uploading
        // multiple files to each target.
        expect(op.results.length).toEqual(1);
        for (let result of op.results) {
            expect(result).not.toBeNull();
            expect(result.operation).toEqual('upload');
            expect(result.provider).toEqual('S3Client');
            expect(result.filesize).toBeGreaterThan(80000);
            expect(result.filepath).not.toBeNull();
            expect(result.filepath).toMatch(tmpBagFile);
            expect(result.remoteURL).not.toBeNull();
            expect(result.remoteURL).toMatch('https://s3.amazonaws.com/aptrust.dart.test');
            expect(result.remoteURL).toMatch(path.basename(tmpBagFile));
            expect(result.remoteChecksum).not.toBeNull();
            expect(result.remoteChecksum.length).toEqual(32);
            expect(result.attempt).toBeGreaterThan(0);
            expect(result.started).toMatch(TestUtil.ISODatePattern);
            expect(result.completed).toMatch(TestUtil.ISODatePattern);
            expect(result.errors.length).toEqual(0);
        }
    }
}

function checkOutputCounts() {
    let counts = {};
    for (let line of outputCatcher.subjectOutput) {
        let data = JSON.parse(line);
        if (!counts[data.action]) {
            counts[data.action] = 1;
        } else {
            counts[data.action] += 1;
        }
    }

    // 4 operations: 1 bagging, 1 validation, 2 uploads
    // 16 files in bag.
    expect(counts.start).toEqual(4);
    expect(counts.fileAdded).toEqual(16);
    expect(counts.add).toEqual(16);
    expect(counts.checksum).toEqual(16);
    expect(counts.completed).toEqual(4);
}

test('Constructor sets expected properties', () => {
    writeJobFile();
    let jobRunner = new JobRunner(tmpJobFile, true);
    expect(jobRunner.jobFilePath).toEqual(tmpJobFile);
    expect(jobRunner.deleteJobFile).toBe(true);
    expect(jobRunner.job).not.toBeNull();
    expect(jobRunner.job.id).toEqual(jobId);
});

test('run() completes when all job operations are valid', done => {
    writeJobFile();
    let jobRunner = new JobRunner(tmpJobFile, true);

    jobRunner.run().then(function(returnCode) {

        expect(returnCode).toEqual(Constants.EXIT_SUCCESS);

        // Ensure bag was created
        expect(fs.existsSync(tmpBagFile)).toBe(true);
        let stats = fs.statSync(tmpBagFile);
        expect(stats.size).toBeGreaterThan(1000);

        checkBagCreatorResults(jobRunner.job, stats);
        checkValidatorResults(jobRunner.job);
        if (helper.envHasS3Credentials()) {
            checkUploadResults(jobRunner.job);
        }
        checkOutputCounts();

        // We set deleteJobFile to true in the constructor,
        // so make sure it's deleted.
        expect(fs.existsSync(tmpJobFile)).toBe(false);

        done();
    });
});
