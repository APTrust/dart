const { PackagingOperation } = require('./packaging_operation');

test('Constructor sets expected properties', () => {
    let packOp = new PackagingOperation('bag_name', '/path/to/output.tar');
    expect(packOp.packageName).toEqual('bag_name');
    expect(packOp.outputPath).toEqual('/path/to/output.tar');
    expect(Array.isArray(packOp.sourceFiles)).toEqual(true);
    expect(packOp.sourceFiles.length).toEqual(0);
    expect(Array.isArray(packOp.skipFiles)).toEqual(true);
    expect(packOp.skipFiles.length).toEqual(0);
    expect(packOp.result).toBeNull();
    expect(packOp.payloadSize).toEqual(0);
});

test('validate()', () => {
    let packOp1 = new PackagingOperation();
    let result1 = packOp1.validate();
    expect(result1.isValid()).toEqual(false);
    expect(result1.errors['PackageOperation.packageName']).toEqual('Package name is required.');
    expect(result1.errors['PackageOperation.outputPath']).toEqual('Output path is required.');
    expect(result1.errors['PackageOperation.sourceFiles']).toEqual('Specify at least one file or directory to package.');

    let packOp2 = new PackagingOperation('bag_name', '/path/to/output.tar');
    packOp2.sourceFiles.push('/path/to/something/you/want/to/bag');
    let result2 = packOp2.validate();
    expect(result2.isValid()).toEqual(true);
    expect(result2.errors['PackageOperation.packageName']).toBeUndefined();
    expect(result2.errors['PackageOperation.outputPath']).toBeUndefined();
    expect(result2.errors['PackageOperation.sourceFiles']).toBeUndefined();
});
