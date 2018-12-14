const { Bagger } = require('./bagger');
const { BagItProfile } = require('./bagit_profile');
const fs = require('fs');
const { Job } = require('../core/job');
const os = require('os');
const { PackagingOperation } = require('../core/packaging_operation');
const path = require('path');
const { Validator } = require('./validator');
const { Util } = require('../core/util');

var tmpFile = path.join(os.tmpdir(), 'TestBag.tar');
var tmpOutputDir = path.join(os.tmpdir(), 'dart-bagger-test');

afterEach(() => {
    if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
    }
    Util.deleteRecursive(tmpOutputDir);
});

function getJob(...sources) {
    var job = new Job();
    job.packagingOp = new PackagingOperation('TestBag', tmpFile);

    // Add the sources we want to pack into the bag
    job.packagingOp.sourceFiles.push(...sources);

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
        let result = bagger.job.packagingOp.result;
        expect(result.errors.length).toEqual(0);
        expect(result.succeeded).toEqual(true);
        expect(result.started).not.toBeNull();
        expect(result.competed).not.toBeNull();
        expect(result.operation).toEqual('bagging');
        expect(result.provider).toEqual('DART bagger');
        expect(result.filename.endsWith('TestBag.tar')).toEqual(true);
        expect(result.filesize).toBeGreaterThan(0);
        done();
    });

    bagger.create();
});

test('create() with one file', done => {
    let job = getJob(__filename);
    let bagger = new Bagger(job);

    bagger.on('finish', function() {
        let result = bagger.job.packagingOp.result;
        expect(result.errors.length).toEqual(0);
        expect(result.succeeded).toEqual(true);
        expect(result.filesize).toBeGreaterThan(0);
        // 2 manifests, 2 tag manifests, 3 tag files, 1 payload file
        expect(bagger.bagItFiles.length).toEqual(8);
        done();
    });

    bagger.create();
});

// This test is unreliable. Usually completes in ~150ms,
// but sometimes times out after 5 seconds.
test('create() with multiple dirs and files', done => {
    let utilDir = path.join(__dirname, '..', 'util');
    let bagsDir = path.join(__dirname, '..', 'test', 'bags');
    let job = getJob(utilDir, __filename, bagsDir);
    let bagger = new Bagger(job);

    bagger.on('finish', function() {
        let result = bagger.job.packagingOp.result;
        expect(result.errors.length).toEqual(0);
        expect(result.succeeded).toEqual(true);
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
        validator.validate();
    });

    bagger.create();
});

test('create() using FileSystemWriter', done => {
    let utilDir = path.join(__dirname, '..', 'util');
    let bagsDir = path.join(__dirname, '..', 'test', 'bags');
    let job = getJob(utilDir, __filename, bagsDir);
    job.packagingOp.packageName = 'dart-bagger-test';
    job.packagingOp.outputPath = tmpOutputDir;
    job.bagItProfile.serialization = 'optional';
    let bagger = new Bagger(job);

    bagger.on('fileAdded', function(bagItFile) {
        //console.log(bagItFile.relDestPath);
    });
    bagger.on('finish', function() {
        let result = bagger.job.packagingOp.result;
        expect(result.errors.length).toEqual(0);
        expect(result.succeeded).toEqual(true);
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
