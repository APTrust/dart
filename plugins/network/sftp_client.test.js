const { Context } = require('../../core/context');
const path = require('path');
const SFTPClient = require('./sftp_client');
const { StorageService } = require('../../core/storage_service');

var skipMessagePrinted = false;
var server = null;
const remoteFileName = 'TestFileForSFTPUpload.xyz';

// TODO: Test actual uploads.
// Old tests were removed because the sftp server was an unreliable
// heap of garbage code. We need a new local test server.
// GitHub Issue: https://github.com/APTrust/dart/issues/318

function getStorageService() {
    return new StorageService({
        name: 'SFTP Service for Unit Tests',
        protocol: 'sftp',
        host: 'localhost',
        port: 8088,
        bucket: 'files/uploads',
        login: 'user',
        password: 'password'
    });
}

function testCommonResultProperties(result, withNullCompleted = false) {
    expect(result.operation).toEqual('upload');
    expect(result.provider).toEqual('SFTPClient');
    expect(result.filepath).toEqual(__filename);
    expect(result.filesize).toBeGreaterThan(1400);
    expect(result.fileMtime).not.toBeNull();
    expect(result.remoteChecksum).toBeNull();
    expect(result.attempt).toEqual(1);
    expect(result.started).not.toBeNull();
    if (withNullCompleted) {
        expect(result.completed).toBeNull();
    } else {
        expect(result.completed).not.toBeNull();
    }
    expect(result.remoteURL).toEqual('sftp://localhost:8088/files/uploads/TestFileForSFTPUpload.xyz');
}

test('Description', () => {
    var desc = SFTPClient.description();
    expect(desc.name).toEqual('SFTPClient');
    expect(desc.implementsProtocols).toEqual(['sftp']);
});

test('Constructor sets expected properties', () => {
    var ss = getStorageService();
    var client = new SFTPClient(ss);
    expect(client.storageService).toEqual(ss);
});

test('_buildUrl', () => {
    var ss = getStorageService();
    var client = new SFTPClient(ss);
    var url = client._buildUrl(remoteFileName);
    expect(url).toEqual('sftp://localhost:8088/TestFileForSFTPUpload.xyz');

    url = client._buildUrl(`files/uploads/${remoteFileName}`);
    expect(url).toEqual('sftp://localhost:8088/files/uploads/TestFileForSFTPUpload.xyz');

    // Make sure we get rid of multiple slashes
    url = client._buildUrl(`//files////uploads//${remoteFileName}`);
    expect(url).toEqual('sftp://localhost:8088/files/uploads/TestFileForSFTPUpload.xyz');
});
