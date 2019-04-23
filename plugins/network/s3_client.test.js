const fs = require('fs');
const Minio = require('minio');
const os = require('os');
const path = require('path');
const S3Client = require('./s3_client');
const { UploadTarget } = require('../../core/upload_target');
const { UploadTestHelper } = require('../../util/upload_test_helper');

let helper = new UploadTestHelper();

test('Description', () => {
    var desc = S3Client.description();
    expect(desc.name).toEqual('S3Client');
    expect(desc.implementsProtocols).toEqual(['s3']);
});

test('Constructor sets expected properties', () => {
    var uploadTarget = helper.getUploadTarget();
    var client = new S3Client(uploadTarget);
    expect(client.uploadTarget).toEqual(uploadTarget);
});

test('_initXferRecord', () => {
    var uploadTarget = helper.getUploadTarget();
    var client = new S3Client(uploadTarget);
    var xfer = client._initXferRecord('upload', __filename, 's3_client.test.js');
    expect(xfer).not.toBeNull();
    expect(xfer.host).toEqual(uploadTarget.host);
    expect(xfer.port).toEqual(uploadTarget.port);
    expect(xfer.localPath).toEqual(__filename);
    expect(xfer.bucket).toEqual(uploadTarget.bucket);
    expect(xfer.key).toEqual('s3_client.test.js');
    expect(xfer.result).not.toBeNull();
    expect(xfer.result.attempt).toEqual(1);
    expect(xfer.result.started).toBeDefined();
    expect(xfer.localStat).toBeDefined();
    expect(xfer.result.filesize).toBeGreaterThan(0);

    xfer = client._initXferRecord('download', __filename, 's3_client.test.js');
    expect(xfer).not.toBeNull();
    expect(xfer.host).toEqual(uploadTarget.host);
    expect(xfer.port).toEqual(uploadTarget.port);
    expect(xfer.localPath).toEqual(__filename);
    expect(xfer.bucket).toEqual(uploadTarget.bucket);
    expect(xfer.key).toEqual('s3_client.test.js');
    expect(xfer.result).not.toBeNull();
    expect(xfer.result.attempt).toEqual(1);
    expect(xfer.result.started).toBeDefined();
    // can't stat the local file before it's downloaded
    expect(xfer.localStat).toBeNull();
    expect(xfer.result.filesize).toEqual(0);
    // But we do know what the remote URL should be on a download.
    expect(xfer.result.remoteURL).toEqual('https://s3.amazonaws.com/aptrust.dart.test/s3_client.test.js');
});

test('_handleError() retries if it has not exceeded MAX_ATTEMPTS', done => {
    var uploadTarget = helper.getUploadTarget();
    var client = new S3Client(uploadTarget);
    var xfer = client._initXferRecord('upload', __filename, 's3_client.test.js');

    // Set this to MAX_ATTEMPTS - 1, so _handleError retries.
    xfer.result.attempt = 9;

    client.on('warning', function(result) {
        expect(result.warning).toMatch(/Will try again/);
        done();
    });

    client._handleError('Oops!', xfer);
});

test('_handleError() sets failure result after too many retries', done => {
    var uploadTarget = helper.getUploadTarget();
    var client = new S3Client(uploadTarget);
    var xfer = client._initXferRecord('upload', __filename, 's3_client.test.js');

    // Set this to exceed max attempts, so _handleError doesn't retry.
    xfer.result.attempt = 1000;

    client.on('error', function(result) {
        expect(result.completed).not.toBeNull();
        expect(result.succeeded()).toBe(false);
        expect(result.errors).toContain('Oops!');
        done();
    });

    client._handleError('Oops!', xfer);
});

test('_getClient()', () => {
    if (!helper.envHasS3Credentials()) {
        return;
    }
    var uploadTarget = helper.getUploadTarget();
    uploadTarget.login = process.env.AWS_ACCESS_KEY_ID;
    uploadTarget.password = process.env.AWS_SECRET_ACCESS_KEY;
    var client = new S3Client(uploadTarget);
    var minioClient = client._getClient();
    expect(minioClient).not.toBeNull();
    expect(minioClient instanceof Minio.Client).toEqual(true);
});

test('upload()', done => {
    if (!helper.envHasS3Credentials()) {
        console.log('Skipping S3 upload test for S3Client: no credentials in ENV.');
        done();
        return;
    }
    var uploadTarget = helper.getUploadTarget();
    uploadTarget.login = process.env.AWS_ACCESS_KEY_ID;
    uploadTarget.password = process.env.AWS_SECRET_ACCESS_KEY;
    var client = new S3Client(uploadTarget);

    var startCalled = false;
    client.on('start', function(result) {
        startCalled = true;
    });

    client.on('warning', function(result) {
        console.log(result.warning);
    });

    client.on('finish', function(result) {
        expect(startCalled).toEqual(true);
        expect(result.errors).toEqual([]);
        expect(result.completed).not.toBeNull();
        expect(result.succeeded()).toBe(true);
        expect(result.remoteURL).toEqual('https://s3.amazonaws.com/aptrust.dart.test/DartUnitTestFile.js');
        expect(result.remoteChecksum.length).toEqual(32);
        done();
    });

    client.upload(__filename, 'DartUnitTestFile.js');
});

test('download()', done => {
    if (!helper.envHasS3Credentials()) {
        done();
        return;
    }
    var uploadTarget = helper.getUploadTarget();
    uploadTarget.login = process.env.AWS_ACCESS_KEY_ID;
    uploadTarget.password = process.env.AWS_SECRET_ACCESS_KEY;
    var client = new S3Client(uploadTarget);

    let tmpFile = path.join(os.tmpdir(), 'DartUnitTestFile.js_' + Date.now());

    var startCalled = false;
    client.on('start', function(result) {
        startCalled = true;
    });

    client.on('error', function(result) {
        // Error means test failed.
        fs.unlinkSync(tmpFile);
        expect(message).toEqual('');
        done();
    });

    client.on('finish', function(result) {
        fs.unlinkSync(tmpFile);
        expect(startCalled).toEqual(true);
        expect(result.errors).toEqual([]);
        expect(result.startted).not.toBeNull();
        expect(result.completed).not.toBeNull();
        expect(result.succeeded()).toBe(true);
        expect(result.remoteURL).toEqual('https://s3.amazonaws.com/aptrust.dart.test/DartUnitTestFile.js');
        expect(result.filesize).toBeGreaterThan(0);
        done();
    });

    // Download the file we uploaded in the test above.
    // This assumes we're running tests with --runInBand,
    // which is what our documentation says we must do.
    client.download(tmpFile, 'DartUnitTestFile.js');
});
