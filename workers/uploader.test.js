const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
//const fs = require('fs');
const { Job } = require('../core/job');
const { OutputCatcher } = require('../util/output_catcher');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const { Uploader } = require('./uploader');
const { UploadOperation } = require('../core/upload_operation');
const { UploadTestHelper } = require('../util/upload_test_helper');
const { Util } = require('../core/util');

let helper = new UploadTestHelper();
let bagFile1 = path.join(__dirname, '..', 'test', 'bags', 'aptrust',
                         'example.edu.tagsample_good.tar');
let bagFile2 = path.join(__dirname, '..', 'test', 'bags', 'aptrust',
                         'example.edu.sample_good.tar');

// All output from the Uploader starts with this:
let outputFilter = '{"op":"upload",';
let outputCatcher = new OutputCatcher(outputFilter);

beforeEach(() => {
    outputCatcher.captureOutput();
    TestUtil.deleteJsonFile('UploadTarget');
});

afterEach(() => {
    outputCatcher.relayJestOutput();
    TestUtil.deleteJsonFile('UploadTarget');
});

function getJob() {
    let uploadTarget = helper.getUploadTarget();
    uploadTarget.save();
    let job = new Job();

    // Do two uploads to the same place, just to make sure
    // uploader handles multiple targets.
    job.uploadOps = [
        new UploadOperation(uploadTarget.id, [bagFile1, bagFile2]),
        new UploadOperation(uploadTarget.id, [bagFile1, bagFile2])
    ];
    return job;
}

test('Constructor sets expected properties', () => {
    let job = getJob();
    let uploader = new Uploader(job);
    expect(uploader.operation).toEqual('upload');
    expect(uploader.exitCode).toEqual(Constants.EXIT_SUCCESS);
    expect(uploader.job.id).toEqual(job.id);
});

test('run()', done => {

    if (!helper.envHasS3Credentials()) {
        console.log('Skipping S3 upload test for workers/Uploader: no credentials in ENV.');
        done();
        return;
    }

    let job = getJob();
    let uploader = new Uploader(job);

    uploader.run().then(function() {
        expect(job.uploadOps.length).toEqual(2);
        for (let op of job.uploadOps) {
            // Can have multiple results because we may be uploading
            // multiple files to each target.
            expect(op.results.length).toEqual(2);
            for (let result of op.results) {
                expect(result).not.toBeNull();
                expect(result.operation).toEqual('upload');
                expect(result.provider).toEqual('S3Client');
                expect(result.filesize).toBeGreaterThan(20000);
                expect(result.filepath).not.toBeNull();
                expect(result.filepath).toMatch('example.edu');
                expect(result.remoteURL).not.toBeNull();
                expect(result.remoteURL).toMatch('example.edu');
                expect(result.remoteChecksum).not.toBeNull();
                expect(result.remoteChecksum.length).toEqual(32);
                expect(result.attempt).toBeGreaterThan(0);
                expect(result.started).toMatch(TestUtil.ISODatePattern);
                expect(result.completed).toMatch(TestUtil.ISODatePattern);
                expect(result.errors.length).toEqual(0);
            }
        }

        // Ensure we got expected output on stdout
        let startCount = 0;
        let completedCount = 0;
        for (let line of outputCatcher.subjectOutput) {
            let data = JSON.parse(line);
            switch (data.action) {
            case 'start':
                startCount++;
                break;
            case 'completed':
                completedCount++;
                break;
            }
        }
        expect(startCount).toEqual(4);
        expect(completedCount).toEqual(4);

        done();
    });
});
