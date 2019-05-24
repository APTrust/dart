const { BagValidator } = require('./bag_validator');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { Job } = require('../core/job');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const { Util } = require('../core/util');
const { ValidationOperation } = require('../core/validation_operation');

let pathToBagFile = path.join(__dirname, '..', 'test', 'bags', 'aptrust',
                              'example.edu.tagsample_good.tar');

function getJob() {
    let job = new Job();
    job.bagItProfile = TestUtil.loadProfilesFromSetup('aptrust')[0];
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
        done();
    });
});
