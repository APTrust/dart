const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { Job } = require('../core/job');
const { JobRunner } = require('./job_runner');
const { OutputCatcher } = require('../util/output_catcher');
const os = require('os');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const { UploadOperation } = require('../core/upload_operation');
const { UploadTestHelper } = require('../util/upload_test_helper');
const { Util } = require('../core/util');
const { ValidationOperation } = require('../core/validation_operation');

// Create a tarred bag here.
let tmpBagFile = Util.tmpFilePath() + ".tar";

// Save the job file here.
let tmpJobFile = Util.tmpFilePath() + ".json";

// Job Id from fixture Job_003.json, which we load below.
let jobId = "96d21b19-82ba-4de3-842c-ff961877e8de";

// This test bag is known to be valid according
// to the APTrust BagIt profile.
let pathToValidTestBag = path.join(__dirname, '..', 'test', 'bags', 'aptrust', 'example.edu.sample_good.tar');


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
    let totalOperations = 4;

    if (!helper.envHasS3Credentials()) {
        totalOperations = 2; // because no uploads
    }

    // 16+ files in bag.
    expect(counts.start).toEqual(totalOperations);
    expect(counts.fileAdded).toBeGreaterThan(15);
    expect(counts.add).toBeGreaterThan(15);
    expect(counts.checksum).toBeGreaterThan(15);
    expect(counts.completed).toEqual(totalOperations);
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


test('run() fails gracefully if package fails (untarred bag)', done => {
    // Can't figure out how to do this safely on Windows yet.
    // 'nul' does not seem to work like /dev/null
    if (os.platform() === 'win32') {
        return
    }

    writeJobFile();
    let jobRunner = new JobRunner(tmpJobFile, true);

    // Force failure by writing to an output file that doesn't exist.
    jobRunner.job.packageOp.outputPath = '/dev/null/file_does_not_exist';

    jobRunner.run().then(function(returnCode) {
        testFailedPackage(jobRunner, returnCode, 'FileSystemWriter:');
        done();
    });
});

test('run() fails gracefully if package fails (tarred bag, cannot create directory)', done => {
    // Windoze!!
    if (os.platform() === 'win32') {
        return
    }

    writeJobFile();
    let jobRunner = new JobRunner(tmpJobFile, true);

    // Force failure by writing to an output file that doesn't exist.
    jobRunner.job.packageOp.outputPath = '/dev/null/xyz/file_does_not_exist.tar';

    jobRunner.run().then(function(returnCode) {
        testFailedPackage(jobRunner, returnCode, 'TarWriter:');
        done();
    });
});

test('run() fails gracefully if package fails (tarred bag, cannot write in directory)', done => {
    // Windoze!!
    if (os.platform() === 'win32') {
        return
    }

    writeJobFile();
    let jobRunner = new JobRunner(tmpJobFile, true);

    // Force failure by writing to an output file that doesn't exist.
    jobRunner.job.packageOp.outputPath = '/dev/null/file_does_not_exist.tar';

    jobRunner.run().then(function(returnCode) {
        testFailedPackage(jobRunner, returnCode, 'TarWriter:');
        done();
    });
});

test('run() fails gracefully if bag is in character device', done => {
    writeJobFile();
    let pathThatDoesNotExist = Util.escapeBackslashes('/dev/null/xyz/bag.tar');
    let jobRunner = new JobRunner(tmpJobFile, true);
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
    writeJobFile();
    let pathThatDoesNotExist = Util.escapeBackslashes('bag_does_not_exist.tar');
    let jobRunner = new JobRunner(tmpJobFile, true);
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
    writeJobFile();
    let pathThatDoesNotExist = Util.escapeBackslashes('dir/does/not/exist');
    let jobRunner = new JobRunner(tmpJobFile, true);
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
    writeJobFile();
    let jobRunner = new JobRunner(tmpJobFile, true);
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
    writeJobFile();
    let jobRunner = new JobRunner(tmpJobFile, true);
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
    writeJobFile();
    let jobRunner = new JobRunner(tmpJobFile, true);
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
    writeJobFile();
    let jobRunner = new JobRunner(tmpJobFile, true);
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

// TODO: Test with upload failure (1 of 1 targets fails)
//
// test('run() fails gracefully if 1 of 1 uploads fails', done => {
//     writeJobFile();
//     let jobRunner = new JobRunner(tmpJobFile, true);
//     jobRunner.job.packageOp = null;
//     jobRunner.job.validationOp = null;

//     // Have just one upload and point it toward an invalid target
//     let badTarget = helper.getUploadTarget();
//     badTarget.login = 'BogusAWSKey';
//     badTarget.password = 'BadKeyForTesting';
//     badTarget.save();
//     jobRunner.job.uploadOps = [
//             new UploadOperation(badTarget.id, [tmpBagFile])
//     ];

//     jobRunner.run().then(function(returnCode) {
//         //console.log(JSON.stringify(jobRunner.job.uloadOps));
//         let result = jobRunner.job.uploadOps[0].result;
//         expect(returnCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
//         expect(result.errors.length).toBeGreaterThan(0);
//         expect(result.errors.join('')).toContain(Context.y18n.__("Oops"));
//         done();
//     });
// });


// TODO: Test with upload failure (1 of 2 targets fails)
