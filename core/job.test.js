const { Job } = require('./job');
const { PackageOperation } = require('./package_operation');

test('Constructor sets expected properties', () => {
    let job = new Job();
    expect(job.bagItProfile).toBeNull();
    expect(job.packagingOp).toBeNull();
    expect(job.validationOp).toBeNull();
    expect(Array.isArray(job.uploadOps)).toEqual(true);
    expect(job.uploadOps.length).toEqual(0);
});

test('validate()', () => {
    let job = new Job();
    // TODO: Add validationOp and uploadOps
    job.packagingOp = new PackageOperation();

    // Errors should be passed through.
    let result = job.validate();
    expect(result).toEqual(false);
    expect(job.errors['PackageOperation.packageName']).toBeDefined();
    expect(job.errors['PackageOperation.outputPath']).toBeDefined();
    expect(job.errors['PackageOperation.sourceFiles']).toBeDefined();
});
