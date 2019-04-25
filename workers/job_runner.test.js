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

test('Constructor sets expected properties', () => {
    writeJobFile();
    let jobRunner = new JobRunner(tmpJobFile, true);
    expect(jobRunner.jobFilePath).toEqual(tmpJobFile);
    expect(jobRunner.deleteJobFile).toBe(true);
    expect(jobRunner.job).not.toBeNull();
    expect(jobRunner.job.id).toEqual(jobId);
});
