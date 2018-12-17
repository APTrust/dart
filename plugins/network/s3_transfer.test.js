const { S3Transfer } = require('./s3_transfer');

test('Constructor sets expected properties', () => {
    var xfer = new S3Transfer('upload', 'S3Client');
    expect(xfer.operation).toEqual('upload');
    expect(xfer.result).not.toBeNull();
    expect(xfer.result.operation).toEqual('upload');
    expect(xfer.result.provider).toEqual('S3Client');
});
