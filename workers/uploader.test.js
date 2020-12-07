const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { Job } = require('../core/job');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const { Uploader } = require('./uploader');
const { UploadOperation } = require('../core/upload_operation');
const { UploadTestHelper } = require('../util/upload_test_helper');
const { Util } = require('../core/util');

let helper = new UploadTestHelper();
let testBagDir = path.join(__dirname, '..', 'test', 'bags', 'aptrust');
let bagFile1 = path.join(testBagDir, 'example.edu.tagsample_good.tar');
let bagFile2 = path.join(testBagDir, 'example.edu.sample_good.tar');
let bagFile3 = path.join(testBagDir, 'example.edu.tagsample_bad.tar');
let bagFile4 = path.join(testBagDir, 'example.edu.sample_missing_data_file.tar');


function getJob() {
    let ss = helper.getStorageService();
    ss.save();
    let job = new Job();

    // Do two uploads to the same place, just to make sure
    // uploader handles multiple targets.
    job.uploadOps = [
        new UploadOperation(ss.id, [bagFile1, bagFile2]),
        new UploadOperation(ss.id, [bagFile3, bagFile4])
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

test('run() using S3 client', done => {

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
        done();
    });
}, 10000);
