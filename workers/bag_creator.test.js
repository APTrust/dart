const { BagCreator } = require('./bag_creator');
const { Constants } = require('../core/constants');
const fs = require('fs');
const { Job } = require('../core/job');
const path = require('path');
const { TestUtil } = require('../core/test_util');
const { Util } = require('../core/util');

// Note that if job.packageOp.outputPath ends with .tar,
// the bagger automatically creates a tar file.
let tmpBagFile = Util.tmpFilePath() + ".tar";

function deleteTmpBagFile() {
    try { fs.unlinkSync(tmpBagFile); }
    catch (ex) { }
}

function getJob() {
    let jobFile = path.join(__dirname, '..', 'test', 'fixtures', 'Job_003.json');
    let job = Job.inflateFromFile(jobFile);
    job.packageOp.outputPath = tmpBagFile;
    job.packageOp.sourceFiles = [
        path.join(__dirname, '..', 'test', 'fixtures'),
        path.join(__dirname, '..', 'test', 'profiles'),
        __filename
    ];
    return job;
}

test('Constructor sets expected properties', () => {
    let job = getJob();
    let bagCreator = new BagCreator(job);
    expect(bagCreator.operation).toEqual('package');
    expect(bagCreator.exitCode).toEqual(Constants.EXIT_SUCCESS);
    expect(bagCreator.job.id).toEqual(job.id);
});

test('run()', done => {
    let job = getJob();
    let bagCreator = new BagCreator(job);

    bagCreator.run().then(function() {

        // Ensure bag was created
        expect(fs.existsSync(tmpBagFile)).toBe(true);
        let stats = fs.statSync(tmpBagFile);
        expect(stats.size).toBeGreaterThan(1000);

        // Ensure BagCreator set the result object
        expect(job.packageOp.result).not.toBeNull();
        expect(job.packageOp.result.operation).toEqual('bagging');
        expect(job.packageOp.result.provider).toEqual('DART bagger');
        expect(job.packageOp.result.filepath).toEqual(tmpBagFile);
        expect(job.packageOp.result.filesize).toEqual(stats.size);
        expect(job.packageOp.result.attempt).toEqual(1);
        expect(job.packageOp.result.started).toMatch(TestUtil.ISODatePattern);
        expect(job.packageOp.result.completed).toMatch(TestUtil.ISODatePattern);
        done();
    });
});
