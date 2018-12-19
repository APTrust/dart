const { S3Transfer } = require('./s3_transfer');

test('Constructor sets expected properties', () => {
    var xfer = new S3Transfer('upload', 'S3Client');
    expect(xfer.operation).toEqual('upload');
    expect(xfer.result).not.toBeNull();
    expect(xfer.result.operation).toEqual('upload');
    expect(xfer.result.provider).toEqual('S3Client');
});

test('getRemoteUrl()', () => {
    var xfer = new S3Transfer('upload', 'S3Client');
    xfer.host = 's3.amazonaws.com';
    xfer.port = 9999;
    xfer.bucket = 'buckety';
    xfer.key = 'francis_scott.key';
    expect(xfer.getRemoteUrl('bag.tar')).toEqual('https://s3.amazonaws.com:9999/buckety/francis_scott.key');
});
