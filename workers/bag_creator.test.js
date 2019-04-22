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

// Generial ISO datetime pattern
let ISOPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z/

let originalWriteFunction = console.log;

let jestOutput = '';
let workerOutput = [];

beforeEach(() => {
    captureOutput();
    deleteTmpBagFile();
})

afterEach(() => {
    relayOutput();
    deleteTmpBagFile();
})

// Filter JSON output from the BagCreator,
// but capture any other output for display later.
function captureOutput() {
    jestOutput = '';
    workerOutput = [];
    console.log = jest.fn(data => {
        if (data.toString().includes('{"op":"package",')) {
            workerOutput.push(data);
        } else {
            jestOutput += data;
        }
    });
}

function relayOutput() {
    console.log = originalWriteFunction;
    if (jestOutput.length > 0) {
        console.log(jestOutput);
    }
}

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
        expect(job.packageOp.result.started).toMatch(ISOPattern);
        expect(job.packageOp.result.completed).toMatch(ISOPattern);

        // Ensure we got expected output on stdout
        let startCount = 0;
        let fileAddedCount = 0;
        let completedCount = 0;
        for (let line of workerOutput) {
            let data = JSON.parse(line);
            switch (data.action) {
            case 'start':
                startCount++;
                break;
            case 'fileAdded':
                fileAddedCount++;
                break;
            case 'completed':
                completedCount++;
                break;
            }
        }
        expect(startCount).toEqual(1);
        expect(fileAddedCount).toBeGreaterThan(5);
        expect(completedCount).toEqual(1);

        done();
    });
});
