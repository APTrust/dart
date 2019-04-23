const { BagValidator } = require('./bag_validator');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { Job } = require('../core/job');
const { OutputCatcher } = require('../util/output_catcher');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const { Util } = require('../core/util');
const { ValidationOperation } = require('../core/validation_operation');

let pathToBagFile = path.join(__dirname, '..', 'test', 'bags', 'aptrust',
                              'example.edu.tagsample_good.tar');

// All output from the BagValidator starts with this:
let outputFilter = '{"op":"validate",';
let outputCatcher = new OutputCatcher(outputFilter);

beforeEach(() => {
    outputCatcher.captureOutput();
})

afterEach(() => {
    outputCatcher.relayJestOutput();
})


function getJob() {
    let job = new Job();
    job.bagItProfile = TestUtil.loadProfile('aptrust_bagit_profile_2.2.json');
    job.validationOp = new ValidationOperation(pathToBagFile);
    return job;
}

test('Constructor sets expected properties', () => {
    let job = getJob();
    let bagValidator = new BagValidator(job);
    expect(bagValidator.operation).toEqual('validate');
    expect(bagValidator.exitCode).toEqual(Constants.EXIT_SUCCESS);
    expect(bagValidator.job.id).toEqual(job.id);
});

test('run()', done => {
    let job = getJob();
    let bagValidator = new BagValidator(job);

    bagValidator.run().then(function() {
        // Ensure BagValidator sets the result object
        expect(job.validationOp.result).not.toBeNull();
        expect(job.validationOp.result.operation).toEqual('validation');
        expect(job.validationOp.result.provider).toEqual('DART BagIt validator');
        expect(job.validationOp.result.filepath).toEqual(pathToBagFile);
        expect(job.validationOp.result.attempt).toEqual(1);
        expect(job.validationOp.result.started).toMatch(TestUtil.ISODatePattern);
        expect(job.validationOp.result.completed).toMatch(TestUtil.ISODatePattern);

        // Ensure we got expected output on stdout
        let startCount = 0;
        let addCount = 0;
        let checksumCount = 0;
        let completedCount = 0;
        for (let line of outputCatcher.subjectOutput) {
            let data = JSON.parse(line);
            switch (data.action) {
            case 'start':
                startCount++;
                break;
            case 'add':
                addCount++;
                break;
            case 'checksum':
                checksumCount++;
                break;
            case 'completed':
                completedCount++;
                break;
            }
        }
        expect(startCount).toEqual(1);
        expect(addCount).toEqual(16);
        expect(checksumCount).toEqual(16);
        expect(completedCount).toEqual(1);

        done();
    });
});
