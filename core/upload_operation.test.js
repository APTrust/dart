const { UploadOperation } = require('./upload_operation');

test('Constructor sets expected properties', () => {
    let uploadOp = new UploadOperation('https://s3.amazonaws.com/receiving', 's3', ['/src/file1.txt', '/src/file2.txt']);
    expect(uploadOp.destination).toEqual('https://s3.amazonaws.com/receiving');
    expect(uploadOp.protocol).toEqual('s3');
    expect(Array.isArray(uploadOp.sourceFiles)).toEqual(true);
    expect(uploadOp.sourceFiles.length).toEqual(2);
    expect(uploadOp.result).toBeNull();
    expect(uploadOp.payloadSize).toEqual(0);
});

test('validate()', () => {
    let uploadOp1 = new UploadOperation();
    let result1 = uploadOp1.validate();
    expect(result1).toEqual(false);
    expect(uploadOp1.errors['UploadOperation.destination']).toEqual('Destination is required.');
    expect(uploadOp1.errors['UploadOperation.protocol']).toEqual('Protocol is required.');
    expect(uploadOp1.errors['UploadOperation.sourceFiles']).toEqual('Specify at least one file or directory to upload.');

    let uploadOp2 = new UploadOperation('https://s3.amazonaws.com/receiving', 's3', ['/src/file1.txt', '/src/file2.txt']);    uploadOp2.sourceFiles.push('/path/to/something/you/want/to/bag');
    let result2 = uploadOp2.validate();
    expect(result2).toEqual(true);
    expect(uploadOp2.errors['UploadOperation.destination']).toBeUndefined();
    expect(uploadOp2.errors['UploadOperation.protocol']).toBeUndefined();
    expect(uploadOp2.errors['UploadOperation.sourceFiles']).toBeUndefined();
});
