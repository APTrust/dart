const { Context } = require('../../core/context');
const SFTPServer = require('./sftp_server');
const SFTPClient = require('./sftp_client');
const { StorageService } = require('../../core/storage_service');

var server = null;

beforeAll(() => {
    server = SFTPServer.start(SFTPServer.PORT);
});

afterAll(() => {
    server.server.close();
});

function getStorageService() {
    return new StorageService({
        name: 'SFTP Service for Unit Tests',
        protocol: 'sftp',
        host: 'localhost',
        port: SFTPServer.DEFAULT_PORT,
        login: SFTPServer.USER,
        password: SFTPServer.PASSWORD
    });
}

function testCommonResultProperties(result) {
    expect(result.operation).toEqual('upload');
    expect(result.provider).toEqual('SFTPClient');
    expect(result.filepath).toEqual(__filename);
    expect(result.filesize).toBeGreaterThan(1400);
    expect(result.fileMtime).not.toBeNull();
    expect(result.remoteChecksum).toBeNull();
    expect(result.attempt).toEqual(1);
    expect(result.started).not.toBeNull();
    expect(result.completed).not.toBeNull();
    expect(result.remoteURL).toEqual('sftp://localhost:8088/TestFileForSFTPUpload.xyz');
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

test('Upload', done => {
    var ss = getStorageService();
    var client = new SFTPClient(ss);
    client.on('finish', function(result) {
        testCommonResultProperties(result);
        expect(result.info).toEqual(Context.y18n.__("Upload succeeded"));
        expect(result.warning).toBeNull();
        expect(result.errors).toEqual([]);
        done();
    });
    client.on('error', function(err) {
        // Force failure
        expect(err).toBeNull();
        done();
    });

    client.upload(__filename, 'TestFileForSFTPUpload.xyz');
});

test('Upload with bad credentials', done => {
    var ss = getStorageService();
    ss.login = 'BAD-LOGIN';
    ss.password = 'BAD-PASSWORD';
    var client = new SFTPClient(ss);
    client.on('finish', function(result) {
        throw "Bad credentials should have thrown an exception."
        done();
    });
    client.on('error', function(result) {
        testCommonResultProperties(result);
        expect(result.info).toBeNull();
        expect(result.warning).toBeNull();
        expect(result.errors.length).toEqual(1);
        expect(result.errors[0]).toMatch(/authentication methods failed/);
        done();
    });
    client.upload(__filename, 'TestFileForSFTPUpload.xyz');
});

test('_getConnSettings', () => {
    var ss = getStorageService();
    var client = new SFTPClient(ss);
    var connSettings = client._getConnSettings();
    expect(connSettings).toEqual({
        host: 'localhost',
        port: 8088,
        username: 'user',
        password: 'password'
    });
});
