const { PackageOperation } = require('./package_operation');

test('Constructor sets expected properties', () => {
    let packOp = new PackageOperation('bag_name', '/path/to/output.tar');
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
    let packOp1 = new PackageOperation();
    let result1 = packOp1.validate();
    expect(result1).toEqual(false);
    expect(packOp1.errors['PackageOperation.packageName']).toEqual('Package name is required.');
    expect(packOp1.errors['PackageOperation.outputPath']).toEqual('Output path is required.');
    expect(packOp1.errors['PackageOperation.sourceFiles']).toEqual('Specify at least one file or directory to package.');

    let packOp2 = new PackageOperation('bag_name', '/path/to/output.tar');
    packOp2.sourceFiles.push('/path/to/something/you/want/to/bag');
    let result2 = packOp2.validate();
    expect(result2).toEqual(true);
    expect(packOp2.errors['PackageOperation.packageName']).toBeUndefined();
    expect(packOp2.errors['PackageOperation.outputPath']).toBeUndefined();
    expect(packOp2.errors['PackageOperation.sourceFiles']).toBeUndefined();
});
