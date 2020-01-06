const { Context } = require('./context');
const { LegacyBags } = require('../util/legacy_bags')
const { OperationResult } = require('./operation_result');
const { PackageOperation } = require('./package_operation');
const { PluginManager } = require('../plugins/plugin_manager');

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
    packOp2.sourceFiles = [__filename];
    let result2 = packOp2.validate();
    expect(result2).toEqual(true);
    expect(packOp2.errors['PackageOperation.packageName']).toBeUndefined();
    expect(packOp2.errors['PackageOperation.outputPath']).toBeUndefined();
    expect(packOp2.errors['PackageOperation.sourceFiles']).toBeUndefined();
});

test('validate() warns on missing files', () => {
    let packageOp = new PackageOperation();
    packageOp.storageServiceId = '00000000-0000-0000-0000-000000000000';
    packageOp.sourceFiles = [
        '1__/file/does/not/exist',
        '2__/file/does/not/exist'
    ];
    let result = packageOp.validate();
    expect(result).toEqual(false);
    expect(packageOp.errors['PackageOperation.sourceFiles']).toEqual(Context.y18n.__('The following files are missing: %s', packageOp.sourceFiles.join('; ')));
});

test('pruneSourceFilesUnlessJobCompleted()', () => {
    let sourceFiles = [
        __filename,
        __dirname,
        'this/file/does/not/exist/98765.xyz'
    ];
    let packOp = new PackageOperation('bag_name', '/path/to/output.tar');
    packOp.sourceFiles = sourceFiles.slice();
    expect(packOp.sourceFiles).toEqual(sourceFiles);

    packOp.pruneSourceFilesUnlessJobCompleted();
    expect(packOp.sourceFiles.includes(__filename)).toBe(true);
    expect(packOp.sourceFiles.includes(__dirname)).toBe(true);
    expect(packOp.sourceFiles.includes('this/file/does/not/exist/98765.xyz')).toBe(false);
    expect(packOp.sourceFiles.length).toEqual(2);

    // Test again with completed operation.
    packOp.sourceFiles = sourceFiles.slice();
    expect(packOp.sourceFiles).toEqual(sourceFiles);

    // Let the result say this operation succeeded.
    packOp.result = new OperationResult('bagging', 'bagger');
    packOp.result.start();
    packOp.result.finish();

    // Now the method should NOT prune anything because that
    // would be altering the historical record.
    packOp.pruneSourceFilesUnlessJobCompleted();
    expect(packOp.sourceFiles).toEqual(sourceFiles);
});

test('getWriter()', () => {
    let writers = PluginManager.canWrite('.tar');
    let pluginDescription = writers[0].description();
    let packOp = new PackageOperation('bag_name', '/path/to/output.tar');
    packOp.packageFormat = '.tar';
    packOp.pluginId = pluginDescription.id;
    let packageWriter = packOp.getWriter();
    expect(packageWriter).not.toBeNull();
    expect(packageWriter.pathToTarFile).toEqual(packOp.outputPath);
    expect(packageWriter.constructor.name).toEqual(pluginDescription.name);
});

test('inflateFrom()', () => {
    let data = {
        packageName: 'bag',
        outputPath: '/dev/null',
        result: {
            operation: 'lobotomy',
            provider: 'the news media'
        }
    };
    let op = PackageOperation.inflateFrom(data);

    // Should copy data attributes
    expect(op.packageName).toEqual(data.packageName);
    expect(op.outputPath).toEqual(data.outputPath);
    expect(op.result).not.toBeNull();
    expect(op.result.operation).toEqual(data.result.operation);

    // Methods should be defined
    expect(typeof op.validate).toEqual('function');
});

test('trimLeadingBags()', () => {
    let nonLegacy = [
        "test.edu.bag1",
        "test.edu.bag2",
        "test.edu.bag3",
    ];

    // Should return whatever _trimLeadingPaths says
    // for non-legacy bags.
    for (let name of nonLegacy) {
        let op = new PackageOperation(name, '/dev/null');
        op._trimLeadingPaths = true;
        expect(op.trimLeadingPaths()).toBe(true);
    }
    for (let name of nonLegacy) {
        let op = new PackageOperation(name, '/dev/null');
        op._trimLeadingPaths = false;
        expect(op.trimLeadingPaths()).toBe(false);
    }

    // Should ALWAYS return false for legacy bags.
    // no matter what _trimLeadingPaths says.
    for (let name of LegacyBags) {
        let op = new PackageOperation(name, '/dev/null');
        op._trimLeadingPaths = true;
        expect(op.trimLeadingPaths()).toBe(false);
    }
    for (let name of LegacyBags) {
        let op = new PackageOperation(name, '/dev/null');
        op._trimLeadingPaths = false;
        expect(op.trimLeadingPaths()).toBe(false);
    }

});
