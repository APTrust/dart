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

test('Constructor sets expected properties', () => {
    var storageService = getStorageService();
    var client = new S3Client(storageService);
    expect(client.storageService).toEqual(storageService);
});
