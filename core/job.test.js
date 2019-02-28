const { BagItProfile } = require('../bagit/bagit_profile');
const { Job } = require('./job');
const { OperationResult } = require('./operation_result');
const { PackageOperation } = require('./package_operation');
const { UploadOperation } = require('./upload_operation');
const { ValidationOperation } = require('./validation_operation');
const path = require('path');

function getJobWithOps() {
    let job = new Job();
    var profilesDir = path.join(__dirname, '..', 'builtin');
    job.bagItProfile = BagItProfile.load(path.join(profilesDir, 'aptrust_bagit_profile_2.2.json'));

    setTag(job.bagItProfile, 'Title', 'Title 1');
    setTag(job.bagItProfile, 'Internal-Sender-Identifier', 'Internal-Sender-Identifier 1');
    setTag(job.bagItProfile, 'Internal-Sender-Description', 'Internal-Sender-Description 1');
    setTag(job.bagItProfile, 'Description', 'Description 1');

    job.packageOp = new PackageOperation();
    job.packageOp.outputPath = "path/to/my_bag.tar";

    job.uploadOps = [new UploadOperation()];
    job.uploadOps[0].sourceFiles = ["path/to/my_file.zip"];

    return job;
}

function setTag(profile, name, value) {
    profile.firstMatchingTag('tagName', name).userValue = value;

}

test('Constructor sets expected properties', () => {
    let job = new Job();
    expect(job.bagItProfile).toBeNull();
    expect(job.packageOp).toBeNull();
    expect(job.validationOp).toBeNull();
    expect(Array.isArray(job.uploadOps)).toEqual(true);
    expect(job.uploadOps.length).toEqual(0);
});

test('validate()', () => {
    let job = new Job();
    // TODO: Add validationOp and uploadOps
    job.packageOp = new PackageOperation();

    // Errors should be passed through.
    let result = job.validate();
    expect(result).toEqual(false);
    expect(job.errors['PackageOperation.packageName']).toBeDefined();
    expect(job.errors['PackageOperation.outputPath']).toBeDefined();
    expect(job.errors['PackageOperation.sourceFiles']).toBeDefined();
});

test('title()', () => {
    let job = getJobWithOps();

    // Should use basename of package path, if available.
    expect(job.title()).toEqual('my_bag.tar');

    // Else, fall back to path of last uploaded file.
    job.packageOp = null;
    expect(job.title()).toEqual('my_file.zip');

    // Fall back to Title, then other tag values
    job.uploadOps = [];
    expect(job.title()).toEqual('Title 1');

    setTag(job.bagItProfile, 'Title', '');
    expect(job.title()).toEqual('Internal-Sender-Identifier 1');

    setTag(job.bagItProfile, 'Internal-Sender-Identifier', '');
    expect(job.title()).toEqual('Internal-Sender-Description 1');

    setTag(job.bagItProfile, 'Internal-Sender-Description', '');
    expect(job.title()).toEqual('Description 1');

    // If no tags, return a generic name.
    setTag(job.bagItProfile, 'Description', '');
    expect(job.title().startsWith('Job of')).toBe(true);
    expect(job.title().length).toBeGreaterThan(20);
});

test('packagedAt()', () => {
    let job = getJobWithOps();
    expect(job.packagedAt()).toBeNull();

    job.packageOp.result = new OperationResult('packaging', '---');
    job.packageOp.result.start();
    job.packageOp.result.finish();
    expect(job.packagedAt()).not.toBeNull();
    expect(job.packagedAt()).toEqual(job.packageOp.result.completed);

    job.packageOp.result = null;
    expect(job.packagedAt()).toBeNull();

    job.packageOp = null;
    expect(job.packagedAt()).toBeNull();
});

test('validatedAt()', () => {
    let job = getJobWithOps();
    expect(job.validatedAt()).toBeNull();

    job.validationOp = new ValidationOperation();
    job.validationOp.result = new OperationResult('validation', '---');
    job.validationOp.result.start();
    job.validationOp.result.finish();
    expect(job.validatedAt()).not.toBeNull();
    expect(job.validatedAt()).toEqual(job.validationOp.result.completed);

    job.validationOp.result = null;
    expect(job.validatedAt()).toBeNull();

    job.validationOp = null;
    expect(job.validatedAt()).toBeNull();
});

test('uploadedAt()', () => {
    let job = getJobWithOps();
    expect(job.uploadedAt()).toBeNull();

    job.uploadOps[0].result = new OperationResult('upload', '---');
    job.uploadOps[0].result.start();
    job.uploadOps[0].result.finish();
    expect(job.uploadedAt()).not.toBeNull();
    expect(job.uploadedAt()).toEqual(job.uploadOps[0].result.completed);

    job.uploadOps[0].result = null;
    expect(job.uploadedAt()).toBeNull();

    job.uploadOps = [];
    expect(job.uploadedAt()).toBeNull();
});

test('packageSucceeded()', () => {
    let job = new Job();
});

test('validationSucceeded()', () => {
    let job = new Job();
});

test('uploadsSucceeded()', () => {
    let job = new Job();
});
