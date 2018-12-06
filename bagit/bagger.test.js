const { Bagger } = require('./bagger');
const { BagItProfile } = require('./bagit_profile');
const fs = require('fs');
const { Job } = require('../core/job');
const os = require('os');
const { PackagingOperation } = require('../core/packaging_operation');
const path = require('path');

var tmpFile = path.join(os.tmpdir(), 'TestBag.tar');

// afterEach(() => {
//     if (fs.existsSync(tmpFile)) {
//         fs.unlinkSync(tmpFile);
//     }
// });


// TODO:
//
// Make sure tags are written correctly to tag files.
//
// Validate entire bag.
//
// Check for expected payload files.
//

function getJob(...sources) {
    var job = new Job();
    job.packagingOperation = new PackagingOperation('TestBag', tmpFile, '.tar');

    // Add the sources we want to pack into the bag
    job.packagingOperation.sourceFiles.push(...sources);

    // Load the profile that describes how to create the bag.
    var profilesDir = path.join(__dirname, '..', 'test', 'profiles');
    job.bagItProfile = BagItProfile.load(path.join(profilesDir, 'multi_manifest.json'));

    // Set required tags for this profile, otherwise the bag will be invalid.
    var access = job.bagItProfile.firstMatchingTag('tagName', 'Access');
    access.userValue = 'Institution';
    var title = job.bagItProfile.firstMatchingTag('tagName', 'Title');
    title.userValue = 'Test Bag';
    var description = job.bagItProfile.firstMatchingTag('tagName', 'Description');
    description.userValue = 'Bag of files for unit testing.';
    return job;
}

test('create() with one dir', done => {
    let sourceDir = path.join(__dirname, '..', 'util');
    let job = getJob(sourceDir);
    let bagger = new Bagger(job);

    bagger.on('finish', function() {
        let result = bagger.job.packagingOperation.result;
        expect(result.error).toBeNull();
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
        let result = bagger.job.packagingOperation.result;
        expect(result.error).toBeNull();
        expect(result.succeeded).toEqual(true);
        expect(result.filesize).toBeGreaterThan(0);
        // 2 manifests, 2 tag manifests, 3 tag files, 1 payload file
        expect(bagger.bagItFiles.length).toEqual(8);
        done();
    });

    bagger.create();
});

test('create() with multiple dirs and files', done => {
    let utilDir = path.join(__dirname, '..', 'util');
    let bagsDir = path.join(__dirname, '..', 'test', 'bags');
    let job = getJob(utilDir, __filename, bagsDir);
    let bagger = new Bagger(job);

    bagger.on('finish', function() {
        let result = bagger.job.packagingOperation.result;
        expect(result.error).toBeNull();
        expect(result.succeeded).toEqual(true);
        expect(result.filesize).toBeGreaterThan(0);
        done();
    });

    bagger.create();
});
