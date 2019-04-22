const { Bagger } = require('./bagger');
const { BagItProfile } = require('./bagit_profile');
const fs = require('fs');
const { Job } = require('../core/job');
const os = require('os');
const { PackageOperation } = require('../core/package_operation');
const path = require('path');
const { Validator } = require('./validator');
const { Util } = require('../core/util');

var tmpFile = path.join(os.tmpdir(), 'TestBag.tar');
var tmpOutputDir = path.join(os.tmpdir(), 'dart-bagger-test');

beforeAll(() => {
	cleanupTempFiles();
});

afterEach(() => {
    // https://github.com/nodejs/node-v0.x-archive/issues/3051
    // On Windows Node's unlinkSync function merely marks a file
    // to be deleted and then returns without deleting it, if the
    // file has an open read handle. Combine this with the fact
    // that Node's implicit auto-closing of file handles happens
    // at unspecified times, and we have a problem. On Windows,
    // it appears as a permission error when a new test tries to
    // open a file that the prior test deleted. The file isn't
    // really deleted. So... we hack in a little sleep time for
    // windows to catch up. Ideally, we'd explicitly close the
    // file handles that the bagger and validator use, but that's
    // tricky, given that they have so many pipes and events
    // attached.
    if (os.platform() === 'win32') {
	    sleepyCleanup();
    } else {
	    cleanupTempFiles();
    }
});

async function sleepyCleanup() {
	await takeANapAndThenCleanUp();
}

function takeANapAndThenCleanUp() {
	return new Promise(resolve => setTimeout(cleanupTempFiles, 500));
}

function cleanupTempFiles() {
    if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
    }
    Util.deleteRecursive(tmpOutputDir);
}

function getJob(...sources) {
    var job = new Job();
    job.packageOp = new PackageOperation('TestBag', tmpFile);

    // Add the sources we want to pack into the bag
    job.packageOp.sourceFiles.push(...sources);

    // Load the profile that describes how to create the bag.
    var profilesDir = path.join(__dirname, '..', 'test', 'profiles');
    job.bagItProfile = BagItProfile.load(path.join(profilesDir, 'multi_manifest.json'));

    // Set required tags for this profile, otherwise the bag will be invalid.
    var access = job.bagItProfile.firstMatchingTag('tagName', 'Access');
    var title = job.bagItProfile.firstMatchingTag('tagName', 'Title');
    var description = job.bagItProfile.firstMatchingTag('tagName', 'Description');
    var sourceOrg = job.bagItProfile.firstMatchingTag('tagName', 'Source-Organization');
    access.userValue = 'Institution';
    title.userValue = 'Test Bag';
    description.userValue = 'Bag of files for unit testing.';
    sourceOrg.userValue = 'School of Hard Knocks';
    return job;
}

test('create() with one dir', done => {
    let sourceDir = path.join(__dirname, '..', 'util');
    let job = getJob(sourceDir);
    let bagger = new Bagger(job);

    bagger.on('finish', function() {
        let result = bagger.job.packageOp.result;
        expect(result.errors.length).toEqual(0);
        expect(result.succeeded()).toEqual(true);
        expect(result.started).not.toBeNull();
        expect(result.competed).not.toBeNull();
        expect(result.operation).toEqual('bagging');
        expect(result.provider).toEqual('DART bagger');
        expect(result.filepath.endsWith('TestBag.tar')).toEqual(true);
        expect(result.filesize).toBeGreaterThan(0);
        done();
    });

    bagger.create();
});

test('create() with one file', done => {
    let job = getJob(__filename);
    let bagger = new Bagger(job);

    bagger.on('finish', function() {
        let result = bagger.job.packageOp.result;
        expect(result.errors.length).toEqual(0);
        expect(result.succeeded()).toEqual(true);
        expect(result.filesize).toBeGreaterThan(0);
        // 2 manifests, 2 tag manifests, 3 tag files, 1 payload file
        expect(bagger.bagItFiles.length).toEqual(8);
        done();
    });

    bagger.create();
});

// This test times out consistently when run on Mac OSX
// with command `npm test -- --runInBand` or
// `npm test bagit/bagger.test.js -- --runInBand`.
//
// It passes consistently on Linux and when run on Mac
// with command `npm test -- -t 'with multiple dirs and files'`
//
// WTF??
test('create() with multiple dirs and files', done => {
    let utilDir = path.join(__dirname, '..', 'util');
    let bagsDir = path.join(__dirname, '..', 'test', 'bags');
    let job = getJob(utilDir, __filename, bagsDir);
    let bagger = new Bagger(job);

    bagger.on('finish', function() {
        let result = bagger.job.packageOp.result;
        expect(result.errors.length).toEqual(0);
        expect(result.succeeded()).toEqual(true);
        expect(result.filesize).toBeGreaterThan(0);

        let validator = new Validator(tmpFile, job.bagItProfile);
        validator.on('end', function(taskDesc) {
            expect(validator.errors).toEqual([]);
            expect(validator.payloadFiles().length).toBeGreaterThan(20);
            expect(validator.payloadManifests().length).toEqual(2);
            expect(validator.tagFiles().length).toEqual(3);
            expect(validator.tagManifests().length).toEqual(2);

            // Make sure tags were written correctly
            let bagInfoFile = validator.files['bag-info.txt'];
            expect(bagInfoFile).not.toBeNull();
            expect(bagInfoFile.keyValueCollection.first('Source-Organization')).toEqual('School of Hard Knocks');
            let aptInfoFile = validator.files['aptrust-info.txt'];
            expect(bagInfoFile).not.toBeNull();
            expect(aptInfoFile.keyValueCollection.first('Access')).toEqual('Institution');
            expect(aptInfoFile.keyValueCollection.first('Title')).toEqual('Test Bag');
            expect(aptInfoFile.keyValueCollection.first('Description')).toEqual('Bag of files for unit testing.');

            done();
        });
        validator.on('error', function(err) {
            // Report the error on the console.
            expect(err).toBeNull();
        });
        validator.validate();
    });

    bagger.create();
});

test('create() using FileSystemWriter', done => {
    let utilDir = path.join(__dirname, '..', 'util');
    let bagsDir = path.join(__dirname, '..', 'test', 'bags');
    let job = getJob(utilDir, __filename, bagsDir);
    job.packageOp.packageName = 'dart-bagger-test';
    job.packageOp.outputPath = tmpOutputDir;
    job.bagItProfile.serialization = 'optional';
    let bagger = new Bagger(job);

    bagger.on('fileAdded', function(bagItFile) {
        //console.log(bagItFile.relDestPath);
    });
    bagger.on('finish', function() {
        let result = bagger.job.packageOp.result;
        expect(result.errors.length).toEqual(0);
        expect(result.succeeded()).toEqual(true);
        expect(result.filesize).toBeGreaterThan(0);

        let validator = new Validator(tmpOutputDir, job.bagItProfile);
        validator.on('end', function(taskDesc) {
            expect(validator.errors).toEqual([]);
            expect(validator.payloadFiles().length).toBeGreaterThan(20);
            expect(validator.payloadManifests().length).toEqual(2);
            expect(validator.tagFiles().length).toEqual(3);
            expect(validator.tagManifests().length).toEqual(2);

            // Make sure tags were written correctly
            let bagInfoFile = validator.files['bag-info.txt'];
            expect(bagInfoFile).not.toBeNull();
            expect(bagInfoFile.keyValueCollection.first('Source-Organization')).toEqual('School of Hard Knocks');
            let aptInfoFile = validator.files['aptrust-info.txt'];
            expect(bagInfoFile).not.toBeNull();
            expect(aptInfoFile.keyValueCollection.first('Access')).toEqual('Institution');
            expect(aptInfoFile.keyValueCollection.first('Title')).toEqual('Test Bag');
            expect(aptInfoFile.keyValueCollection.first('Description')).toEqual('Bag of files for unit testing.');

            done();
        });
        validator.validate();
    });

    bagger.create();
});