const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { Job } = require('../core/job');
const { JobRunner } = require('./job_runner');
const os = require('os');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const { UploadOperation } = require('../core/upload_operation');
const { UploadTestHelper } = require('../util/upload_test_helper');
const { Util } = require('../core/util');
const { ValidationOperation } = require('../core/validation_operation');

// Create a tarred bag here.
let tmpBagFile = Util.tmpFilePath() + ".tar";

// Job Id from fixture Job_003.json, which we load below.
let jobId = "96d21b19-82ba-4de3-842c-ff961877e8de";

// This test bag is known to be valid according
// to the APTrust BagIt profile.
let pathToValidTestBag = path.join(__dirname, '..', 'test', 'bags', 'aptrust', 'example.edu.sample_good.tar');

let helper = new UploadTestHelper();
let skipMessagePrinted = false;

function deleteTmpBagFile() {
    try { fs.unlinkSync(tmpBagFile); }
    catch (ex) { }
}

function getJob() {
    let ss = helper.getStorageService();
    ss.save();
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
            new UploadOperation(ss.id, [tmpBagFile]),
            new UploadOperation(ss.id, [tmpBagFile])
        ];
    } else {
        job.uploadOps = [];
        if (!skipMessagePrinted) {
            console.log('Skipping upload portion of JobRunner test: no AWS credentials in environment.');
            skipMessagePrinted = true;
        }
    }
    return job;
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

function testFailedPackage(jobRunner, returnCode, errorPrefix) {
    let result = jobRunner.job.packageOp.result;

    // Make sure we got the correct exit code.
    expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);

    // Make sure the packageOp result captured the error.
    expect(result.hasErrors()).toBe(true);
    expect(result.firstError()).toMatch(errorPrefix);

    // Make sure the job runner stopped after this error
    // and did not attempt the validation or upload ops
    // (since there's no package to validate or upload).
    expect(jobRunner.job.validationOp.result).toBeNull();

    for (let uploadOp of jobRunner.job.uploadOps) {
        expect(uploadOp.results.length).toEqual(0);
    }
}

test('Constructor sets expected properties', () => {
    let job = getJob();;
    let jobRunner = new JobRunner(job);
    expect(jobRunner.job).toEqual(job);
});

test('run() completes when all job operations are valid', done => {
    let job = getJob();;
    let jobRunner = new JobRunner(job);

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
        done();
    });
});


test('run() fails gracefully if package fails (untarred bag)', done => {
    // Can't figure out how to do this safely on Windows yet.
    // 'nul' does not seem to work like /dev/null
    if (os.platform() === 'win32') {
        done();
        return
    }

    let job = getJob();;
    let jobRunner = new JobRunner(job);

    // Force failure by writing to an output file that doesn't exist.
    jobRunner.job.packageOp.outputPath = '/dev/null/file_does_not_exist';

    jobRunner.run().then(function(returnCode) {
        testFailedPackage(jobRunner, returnCode, 'Error: ENOTDIR');
        done();
    });
});

test('run() fails gracefully if package fails (tarred bag, cannot create directory)', done => {
    // Windoze!!
    if (os.platform() === 'win32') {
        done();
        return
    }

    let job = getJob();;
    let jobRunner = new JobRunner(job);

    // Force failure by writing to an output file that doesn't exist.
    jobRunner.job.packageOp.outputPath = '/dev/null/xyz/file_does_not_exist.tar';

    jobRunner.run().then(function(returnCode) {
        testFailedPackage(jobRunner, returnCode, 'Error: ENOTDIR');
        done();
    });
});

test('run() fails gracefully if package fails (tarred bag, cannot write in directory)', done => {
    // Windoze!!
    if (os.platform() === 'win32') {
        done();
        return
    }

    let job = getJob();;
    let jobRunner = new JobRunner(job);

    // Force failure by writing to an output file that doesn't exist.
    jobRunner.job.packageOp.outputPath = '/dev/null/file_does_not_exist.tar';

    jobRunner.run().then(function(returnCode) {
        testFailedPackage(jobRunner, returnCode, 'Error: EEXIST');
        done();
    });
});

test('run() fails gracefully if bag is in character device', done => {
    let job = getJob();;
    let pathThatDoesNotExist = Util.escapeBackslashes('/dev/null/xyz/bag.tar');
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.validationOp = new ValidationOperation(pathThatDoesNotExist);

    jobRunner.run().then(function(returnCode) {
        let result = jobRunner.job.validationOp.result;
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.join('')).toContain(Context.y18n.__('Error gathering info about bag'));
        done();
    });
});

test('run() fails gracefully if bag file does not exist', done => {
    let job = getJob();;
    let pathThatDoesNotExist = Util.escapeBackslashes('bag_does_not_exist.tar');
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.validationOp = new ValidationOperation(pathThatDoesNotExist);

    jobRunner.run().then(function(returnCode) {
        let result = jobRunner.job.validationOp.result;
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.join('')).toContain(Context.y18n.__('Error gathering info about bag'));
        done();
    });
});

test('run() fails gracefully if bag directory does not exist', done => {
    let job = getJob();;
    let pathThatDoesNotExist = Util.escapeBackslashes('dir/does/not/exist');
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.validationOp = new ValidationOperation(pathThatDoesNotExist);

    jobRunner.run().then(function(returnCode) {
        let result = jobRunner.job.validationOp.result;
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.join('')).toContain(Context.y18n.__('Error gathering info about bag'));
        done();
    });
});

test('run() fails gracefully if BagItProfile is missing', done => {
    let job = getJob();;
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.bagItProfile = null;
    jobRunner.job.validationOp = new ValidationOperation(pathToValidTestBag);

    jobRunner.run().then(function(returnCode) {
        let result = jobRunner.job.validationOp.result;
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.join('')).toContain(Context.y18n.__("Cannot validate bag because job has no BagItProfile."));
        done();
    });
});

test('run() fails gracefully if BagItProfile is invalid', done => {
    let job = getJob();;
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.bagItProfile.tags = []; // no tag defs = invalid
    jobRunner.job.validationOp = new ValidationOperation(pathToValidTestBag);

    jobRunner.run().then(function(returnCode) {
        let result = jobRunner.job.validationOp.result;
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.join('')).toContain(Context.y18n.__('Profile lacks requirements for bagit.txt tag file.'));
        done();
    });
});

// -------------------------------------------------------------------------
// NOTE: The serialization check happens before validation, which is why
// we test that feature separately. If the bag does not follow the profile's
// serialization rules, we don't even bother to validate it.
// -------------------------------------------------------------------------

test('run() fails gracefully if required serialization is missing', done => {
    let job = getJob();;
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.validationOp = new ValidationOperation(pathToValidTestBag);

    // APTrust BagIt profile says bag must be tarred.
    // Point to an untarred bag and make sure we handle
    // the problem without blowing up.
    jobRunner.job.validationOp.pathToBag = pathToValidTestBag.replace(/.tar$/, '');


    jobRunner.run().then(function(returnCode) {
        let result = jobRunner.job.validationOp.result;
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.join('')).toContain(Context.y18n.__("Profile says bag must be serialized, but it is a directory."));
        done();
    });
});

test('run() fails gracefully if serialization is wrong format', done => {
    let job = getJob();;
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.validationOp = new ValidationOperation(pathToValidTestBag);

    // APTrust format says tar, not zip
    jobRunner.job.validationOp.pathToBag = pathToValidTestBag.replace(/.tar$/, '.zip');


    jobRunner.run().then(function(returnCode) {
        let result = jobRunner.job.validationOp.result;
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.join('')).toContain(Context.y18n.__("Bag has extension .zip, but profile says it must be serialized as of one of the following types: application/tar."));
        done();
    });
});

test('run() fails gracefully if upload file does not exist', done => {
    if (!helper.envHasS3Credentials()) {
        done();
        return;
    }
    let job = getJob();;
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.validationOp = null;
    jobRunner.job.uploadOps[0].sourceFiles[0] += 'FileDoesNotExist';

    jobRunner.run().then(function(returnCode) {
        let result = jobRunner.job.uploadOps[0].results[0];

        // This should be EXIT_INVALID_PARAMS, but uploader.js
        // currently has no way of distinguishing bad params
        // from runtime errors in this particular case.
        // TODO: Fix that.
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.join('')).toContain(Context.y18n.__("File to be uploaded does not exist"));
        done();
    });
});

test('run() fails gracefully if 1 of 1 uploads fails', done => {
    if (!helper.envHasS3Credentials()) {
        done();
        return;
    }
    let job = getJob();;
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.validationOp = null;

    // Have just one upload and point it toward an invalid target
    let badTarget = helper.getStorageService();
    badTarget.login = 'BogusAWSKey';
    badTarget.password = 'BadKeyForTesting';
    badTarget.save();
    jobRunner.job.uploadOps = [
            new UploadOperation(badTarget.id, [__filename])
    ];

    jobRunner.run().then(function(returnCode) {
        let result = jobRunner.job.uploadOps[0].results[0];
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        expect(result.hasErrors()).toBe(true);
        expect(result.errors.join('')).toEqual(Context.y18n.__("S3Error: The AWS Access Key Id you provided does not exist in our records."));
        done();
    });
});


test('run() fails gracefully if 1 of 3 uploads fails', done => {
    if (!helper.envHasS3Credentials()) {
        done();
        return;
    }
    let job = getJob();;
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.validationOp = null;

    // Create an upload target with bad credentials.
    let badTarget = helper.getStorageService();
    badTarget.login = 'BogusAWSKey';
    badTarget.password = 'BadKeyForTesting';
    badTarget.save();

    // First upload operation should succeed.
    // uploadOps[0] is using a valid upload target,
    // so just set the source to a file that exists.
    jobRunner.job.uploadOps[0].sourceFiles[0] = __filename

    // Second upload op will fail with bad S3 credentials.
    jobRunner.job.uploadOps[1] = new UploadOperation(badTarget.id, [__filename]);

    // Add one more operation, which should complete even
    // after op #2 fails.
    let goodTarget = helper.getStorageService();
    goodTarget.save();
    jobRunner.job.uploadOps.push(new UploadOperation(goodTarget.id, [__filename]));

    jobRunner.run().then(function(returnCode) {
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);

        let firstResult = jobRunner.job.uploadOps[0].results[0];
        expect(firstResult.errors.length).toEqual(0);

        let secondResult = jobRunner.job.uploadOps[1].results[0];
        expect(secondResult.errors.length).toBeGreaterThan(0);
        expect(secondResult.errors.join('')).toEqual(Context.y18n.__("S3Error: The AWS Access Key Id you provided does not exist in our records."));

        let thirdResult = jobRunner.job.uploadOps[2].results[0];
        expect(firstResult.errors.length).toEqual(0);

        done();
    });
});

// Test with non-existent upload target. This can happen if
// user saves a job with an StorageService, then deletes the
// StorageService, then tries to run the job.
test('run() fails gracefully if StorageService does not exist', done => {
    let job = getJob();;
    let jobRunner = new JobRunner(job);
    jobRunner.job.packageOp = null;
    jobRunner.job.validationOp = null;

    jobRunner.job.uploadOps = [
        new UploadOperation(Util.uuid4(), [__filename]),
        new UploadOperation(Util.uuid4(), [__filename])
    ];

    jobRunner.run().then(function(returnCode) {
        expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        let firstResult = jobRunner.job.uploadOps[0].results[0];
        expect(firstResult.hasErrors()).toBe(true);

        let secondResult = jobRunner.job.uploadOps[1].results[0];
        expect(secondResult.hasErrors()).toBe(true);

        done();
    });
});
