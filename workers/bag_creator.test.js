const { BagCreator } = require('./bag_creator');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const { Job } = require('../core/job');
const path = require('path');
const { Util } = require('../core/util');

// Note that if job.packageOp.outputPath ends with .tar,
// the bagger automatically creates a tar file.
let tmpBagFile = Util.tmpFilePath() + ".tar";

let originalWriteFunction = process.stdout.write;
let capturedOutput = '';

beforeEach(() => {
    capturedOutput = '';
    process.stdout.write = jest.fn(data => {
        // Filter JSON output from the BagCreator,
        // but capture any other output for display
        // later.
        if (!data.toString().includes('{"op":"package",')) {
            capturedOutput += data;
        }
    });
    deleteTmpBagFile();
})

afterEach(() => {
    process.stdout.write = originalWriteFunction;
    if (capturedOutput.length > 0) {
        console.log(capturedOutput);
    }
    deleteTmpBagFile();
})

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

test('run() creates a bag and sets OperationResult', done => {
    let job = getJob();
    let bagCreator = new BagCreator(job);

    bagCreator.run().then(function() {
        expect(fs.existsSync(tmpBagFile)).toBe(true);
        let stats = fs.statSync(tmpBagFile);
        expect(stats.size).toBeGreaterThan(1000);
        //console.log(job.packageOp);
        expect(job.packageOp.result).not.toBeNull();
        expect(job.packageOp.result.operation).toEqual('bagging');
        expect(job.packageOp.result.provider).toEqual('DART bagger');
        expect(job.packageOp.result.filepath).toEqual(tmpBagFile);
        expect(job.packageOp.result.filesize).toEqual(stats.size);
        expect(job.packageOp.result.attempt).toEqual(1);
        expect(job.packageOp.result.started).toBeGreaterThan(0);
        expect(job.packageOp.result.completed).toBeGreaterThan(0);
        done();
    });
});
