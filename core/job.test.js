const { BagItProfile } = require('../bagit/bagit_profile');
const { Job } = require('./job');
const { OperationResult } = require('./operation_result');
const { PackageOperation } = require('./package_operation');
const path = require('path');
const { TestUtil } = require('./test_util');
const { UploadOperation } = require('./upload_operation');
const { ValidationOperation } = require('./validation_operation');


function getJobWithOps() {
    let job = new Job();
    let profiles = TestUtil.loadProfilesFromSetup('aptrust');
    job.bagItProfile = profiles[0];

    setTag(job.bagItProfile, 'Title', 'Title 1');
    setTag(job.bagItProfile, 'Internal-Sender-Identifier', 'Internal-Sender-Identifier 1');
    setTag(job.bagItProfile, 'Internal-Sender-Description', 'Internal-Sender-Description 1');
    setTag(job.bagItProfile, 'Description', 'Description 1');

    job.packageOp = new PackageOperation();
    job.packageOp.packageName = "bag_of_photos";
    job.packageOp.outputPath = "path/to/bags";

    job.uploadOps = [new UploadOperation()];
    job.uploadOps[0].sourceFiles = ["path/to/my_file.zip"];

    job.validationOp = new ValidationOperation();

    return job;
}

function setTag(profile, name, value) {
    profile.firstMatchingTag('tagName', name).userValue = value;
}

test('Constructor sets expected properties', () => {
    let job = new Job();
    expect(job.bagItProfile).toBeNull();
    expect(job.packageOp).not.toBeNull();
    expect(job.packageOp.constructor.name).toEqual('PackageOperation');
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

test('title', () => {
    let job = getJobWithOps();

    // Should use basename of package path, if available.
    expect(job.title).toEqual('bag_of_photos');

    // Else, fall back to path of last uploaded file.
    job.packageOp = null;
    expect(job.title).toEqual('my_file.zip');

    // Fall back to Title, then other tag values
    job.uploadOps = [];
    expect(job.title).toEqual('Title 1');

    setTag(job.bagItProfile, 'Title', '');
    expect(job.title).toEqual('Internal-Sender-Identifier 1');

    setTag(job.bagItProfile, 'Internal-Sender-Identifier', '');
    expect(job.title).toEqual('Internal-Sender-Description 1');

    setTag(job.bagItProfile, 'Internal-Sender-Description', '');
    expect(job.title).toEqual('Description 1');

    // If no tags, return a generic name.
    setTag(job.bagItProfile, 'Description', '');
    expect(job.title.startsWith('Job of')).toBe(true);
    expect(job.title.length).toBeGreaterThan(20);
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

    job.uploadOps[0].results.push(new OperationResult('upload', '---'));
    job.uploadOps[0].results[0].start();
    job.uploadOps[0].results[0].finish();
    expect(job.uploadedAt()).not.toBeNull();
    expect(job.uploadedAt()).toEqual(job.uploadOps[0].results[0].completed);

    job.uploadOps[0].results[0] = null;
    expect(job.uploadedAt()).toBeNull();

    job.uploadOps = [];
    expect(job.uploadedAt()).toBeNull();
});

test('packageAttempted()', () => {
    let job = getJobWithOps();
    expect(job.packageAttempted()).toBe(false);
    job.packageOp.result = new OperationResult('packaging', '---');
    job.packageOp.result.start();
    expect(job.packageAttempted()).toBe(true);
});

test('packageSucceeded()', () => {
    let job = getJobWithOps();
    expect(job.packageSucceeded()).toBe(false);
    job.packageOp.result = new OperationResult('packaging', '---');
    job.packageOp.result.start();
    expect(job.packageSucceeded()).toBe(false);
    job.packageOp.result.finish();
    expect(job.packageSucceeded()).toBe(true);
});

test('validationAttempted()', () => {
    let job = getJobWithOps();
    expect(job.validationAttempted()).toBe(false);
    job.validationOp.result = new OperationResult('validation', '---');
    job.validationOp.result.start();
    expect(job.validationAttempted()).toBe(true);
});

test('validationSucceeded()', () => {
    let job = getJobWithOps();
    expect(job.validationSucceeded()).toBe(false);
    job.validationOp.result = new OperationResult('validation', '---');
    job.validationOp.result.start();
    expect(job.validationSucceeded()).toBe(false);
    job.validationOp.result.finish();
    expect(job.validationSucceeded()).toBe(true);
});

test('uploadAttempted()', () => {
    let job = getJobWithOps();
    expect(job.uploadAttempted()).toBe(false);
    job.uploadOps[0].results = [new OperationResult('upload', '---')];
    job.uploadOps[0].results[0].start();
    expect(job.uploadAttempted()).toBe(true);
});

test('uploadSucceeded()', () => {
    let job = getJobWithOps();
    expect(job.uploadSucceeded()).toBe(false);
    job.uploadOps[0].results = [new OperationResult('upload', '---')];
    job.uploadOps[0].results[0].start();
    expect(job.uploadSucceeded()).toBe(false);
    job.uploadOps[0].results[0].finish();
    expect(job.uploadSucceeded()).toBe(true);
});

test('inflateFrom()', () => {
    let job = getJobWithOps();
    let json = JSON.stringify(job);

    let newJob = Job.inflateFrom(JSON.parse(json));

    expect(newJob.createdAt).toEqual(job.createdAt.toISOString());
    expect(typeof newJob.validate).toEqual('function');

    // bagItProfile
    expect(newJob.bagItProfile).not.toBeNull();
    expect(newJob.bagItProfile.id).toEqual(job.bagItProfile.id);
    expect(newJob.bagItProfile.firstMatchingTag('tagName', 'Title').userValue).toEqual('Title 1');

    // packageOp
    expect(newJob.packageOp).not.toBeNull();
    expect(newJob.packageOp.outputPath).toEqual('path/to/bags');
    expect(typeof newJob.packageOp.validate).toEqual('function');

    // validationOp
    expect(newJob.validationOp).not.toBeNull();

    // uploadOps
    expect(newJob.uploadOps.length).toEqual(1);
    expect(newJob.uploadOps[0]).not.toBeNull();
    expect(newJob.uploadOps[0].sourceFiles).not.toEqual(['path/to/my/file.zip']);
    expect(typeof newJob.uploadOps[0].validate).toEqual('function');
});

test('inflateFromFile()', () => {
    let pathToFile = path.join(__dirname, '..', 'test', 'fixtures', 'Job_001.json');
    let job = Job.inflateFromFile(pathToFile);
    expect(job.bagItProfile.id).toEqual('24a1e6ac-f1f4-4ec5-b020-b97887e32284');
    expect(job.packageOp.sourceFiles.length).toEqual(4);
    expect(job.uploadOps[0].storageServiceId).toEqual('e712265a-45ee-41be-b3b0-c4a8c7929e00');
});

test('find()', () => {
    let job = getJobWithOps();
    job.save();

    // Make sure the Job's sub-objects are correctly converted
    // to the proper types (with functions) after a find.
    let retrievedJob = Job.find(job.id);

    // bagItProfile
    expect(retrievedJob.bagItProfile).not.toBeNull();
    expect(retrievedJob.bagItProfile.id).toEqual(job.bagItProfile.id);
    expect(retrievedJob.bagItProfile.firstMatchingTag('tagName', 'Title').userValue).toEqual('Title 1');

    // packageOp
    expect(retrievedJob.packageOp).not.toBeNull();
    expect(retrievedJob.packageOp.outputPath).toEqual('path/to/bags');
    expect(typeof retrievedJob.packageOp.validate).toEqual('function');

    // validationOp
    expect(retrievedJob.validationOp).not.toBeNull();

    // uploadOps
    expect(retrievedJob.uploadOps.length).toEqual(1);
    expect(retrievedJob.uploadOps[0]).not.toBeNull();
    expect(retrievedJob.uploadOps[0].sourceFiles).not.toEqual(['path/to/my/file.zip']);
    expect(typeof retrievedJob.uploadOps[0].validate).toEqual('function');

});

test('getRunErrors()', () => {
    let job = getJobWithOps();
    job.uploadOps.push(new UploadOperation());
    job.uploadOps[0].results = [new OperationResult(), new OperationResult()];
    job.uploadOps[1].results = [new OperationResult(), new OperationResult()];
    job.packageOp.result = new OperationResult();
    job.validationOp.result = new OperationResult();
    expect(job.getRunErrors()).toEqual([]);

    job.packageOp.result.errors = ['package err 1', 'package err 2'];
    job.validationOp.result.errors = ['val err 1', 'val err 2'];
    job.uploadOps[0].results[0].errors = ['upload err 1.1', 'upload err 1.2'];
    job.uploadOps[0].results[1].errors = ['upload err 2.1', 'upload err 2.2'];
    job.uploadOps[1].results[0].errors = ['upload err 3.1', 'upload err 3.2'];
    job.uploadOps[1].results[1].errors = ['upload err 4.1', 'upload err 4.2'];
    expect(job.getRunErrors()).toEqual([
        'package err 1',
        'package err 2',
        'val err 1',
        'val err 2',
        'upload err 1.1',
        'upload err 1.2',
        'upload err 2.1',
        'upload err 2.2',
        'upload err 3.1',
        'upload err 3.2',
        'upload err 4.1',
        'upload err 4.2'
    ]);
});
