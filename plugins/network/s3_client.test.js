const path = require('path');
const S3Client = require('./s3_client');
const { StorageService } = require('../../core/storage_service');

function getStorageService() {
    var ss = new StorageService('unittest');
    ss.protocol = 's3';
    ss.host = 's3.amazonaws.com';
    ss.bucket = 'aptrust.receiving.test.edu';
    return ss;
}

function canTalkToS3() {
    return (typeof process.env.AWS_ACCESS_KEY_ID != 'undefined' && process.env.AWS_SECRET_ACCESS_KEY != 'undefined');
}

test('Description', () => {
    var desc = S3Client.description();
    expect(desc.name).toEqual('S3Client');
    expect(desc.implementsProtocols).toEqual(['s3']);
});

test('Constructor sets expected properties', () => {
    var storageService = getStorageService();
    var client = new S3Client(storageService);
    expect(client.storageService).toEqual(storageService);
});

test('_initUploadXfer', () => {
    var storageService = getStorageService();
    var client = new S3Client(storageService);
    var xfer = client._initUploadXfer(__filename, 's3_client.test.js');
    expect(xfer).not.toBeNull();
    expect(xfer.localPath).toEqual(__filename);
    expect(xfer.bucket).toEqual(storageService.bucket);
    expect(xfer.key).toEqual('s3_client.test.js');
    expect(xfer.result).not.toBeNull();
    expect(xfer.result.attempt).toEqual(1);
    expect(xfer.result.started).toBeDefined();
    expect(xfer.localStat).toBeDefined();
    expect(xfer.result.filesize).toBeGreaterThan(0);
});
