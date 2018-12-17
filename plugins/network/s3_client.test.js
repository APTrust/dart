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

test('_handleError() retries if it has not exceeded MAX_ATTEMPTS', done => {
    var storageService = getStorageService();
    var client = new S3Client(storageService);
    var xfer = client._initUploadXfer(__filename, 's3_client.test.js');

    // Set this to MAX_ATTEMPTS - 1, so _handleError retries.
    xfer.result.attempt = 9;

    client.on('warning', function(message) {
        expect(message).toMatch(/Will try again/);
        done();
    });

    client._handleError('Oops!', xfer);
});

test('_handleError() sets failure result after too many retries', done => {
    var storageService = getStorageService();
    var client = new S3Client(storageService);
    var xfer = client._initUploadXfer(__filename, 's3_client.test.js');

    // Set this to exceed max attempts, so _handleError doesn't retry.
    xfer.result.attempt = 1000;

    client.on('finish', function(result) {
        expect(result.completed).not.toBeNull();
        expect(result.succeeded).toEqual(false);
        expect(result.errors).toContain('Oops!');
        done();
    });

    client._handleError('Oops!', xfer);
});
