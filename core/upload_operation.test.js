const { Context } = require('./context');
const { UploadOperation } = require('./upload_operation');
const { UploadTarget } = require('./upload_target');

function newUploadOp() {
    let target = new UploadTarget({
        name: 'Sample Target',
        protocol: 's3'
    });
    target.save();
    return new UploadOperation(target.id, ['/src/file1.txt', '/src/file2.txt']);
}

test('Constructor sets expected properties', () => {
    let uploadOp = newUploadOp();
    //expect(uploadOp.destination).toEqual('https://s3.amazonaws.com/receiving');
    //expect(uploadOp.protocol).toEqual('s3');
    expect(Array.isArray(uploadOp.sourceFiles)).toEqual(true);
    expect(uploadOp.sourceFiles.length).toEqual(2);
    expect(uploadOp.results.length).toEqual(0);
    expect(uploadOp.payloadSize).toEqual(0);
});

test('validate()', () => {
    let uploadOp1 = new UploadOperation();
    let result1 = uploadOp1.validate();
    expect(result1).toEqual(false);
    expect(uploadOp1.errors['UploadOperation.sourceFiles']).toEqual(Context.y18n.__('Specify at least one file or directory to upload.'));
    expect(uploadOp1.errors['UploadOperation.uploadTargetId']).toEqual(Context.y18n.__('You must specify an upload target.'));

    let uploadOp2 = newUploadOp();
    uploadOp2.sourceFiles = [__filename];
    let result2 = uploadOp2.validate();
    expect(result2).toEqual(true);
    expect(uploadOp2.errors['UploadOperation.uploadTargetId']).toBeUndefined();
    expect(uploadOp2.errors['UploadOperation.sourceFiles']).toBeUndefined();
});

test('validate() warns on missing files', () => {
    let uploadOp = new UploadOperation();
    uploadOp.uploadTargetId = '00000000-0000-0000-0000-000000000000';
    uploadOp.sourceFiles = [
        '1__/file/does/not/exist',
        '2__/file/does/not/exist'
    ];
    let result = uploadOp.validate();
    expect(result).toEqual(false);
    expect(uploadOp.errors['UploadOperation.sourceFiles']).toEqual(Context.y18n.__('The following files are missing: %s', uploadOp.sourceFiles.join('; ')));
});

test('inflateFrom()', () => {
    let uuid = '54298a7e-5a73-4b28-a512-227f477ff09f';
    let data = {
        uploadTargetId: uuid,
        results: [{
            operation: 'lobotomy',
            provider: 'the news media'
        }]
    };
    let op = UploadOperation.inflateFrom(data);

    // Should copy data attributes
    expect(op.uploadTargetId).toEqual(uuid);
    expect(op.results.length).toEqual(1);
    expect(op.results[0].operation).toEqual(data.results[0].operation);

    // Methods should be defined
    expect(typeof op.validate).toEqual('function');
});
