const { Context } = require('../../core/context');
const fork = require('child_process').fork;
const path = require('path');
const SFTPClient = require('./sftp_client');
const SFTPServer = require('../../test/servers/sftp.js');
const { StorageService } = require('../../core/storage_service');

var skipMessagePrinted = false;
var server = null;
const filename = path.join(__dirname, '../../test/servers/sftp.js')
const remoteFileName = 'TestFileForSFTPUpload.xyz';


// Note: Our sftp test server accepts username 'user' with
// password 'password'. Anything else results in auth failure.

var serverProcess = null;

beforeAll(() => {
    //serverProcess = fork(path.join(__dirname, '../../test/servers/sftp.js'))
    SFTPServer.start()
});

afterAll(() => {
    //serverProcess.kill('SIGINT')
    SFTPServer.stop()
    //SFTPServer.close()
});


function getStorageService() {
    return new StorageService({
        name: 'SFTP Service for Unit Tests',
        protocol: 'sftp',
        host: 'localhost',
        port: 9999,
        bucket: 'files/uploads',
        login: 'user',
        password: 'password'
    });
}

function testCommonResultProperties(result, withNullCompleted = false) {
    expect(result.operation).toEqual('upload');
    expect(result.provider).toEqual('SFTPClient');
    expect(result.filepath).toEqual(filename);
    expect(result.filesize).toBeGreaterThan(1200);
    expect(result.fileMtime).not.toBeNull();
    expect(result.remoteChecksum).toBeNull();
    expect(result.attempt).toEqual(1);
    expect(result.started).not.toBeNull();
    if (withNullCompleted) {
        expect(result.completed).toBeNull();
    } else {
        expect(result.completed).not.toBeNull();
    }
    expect(result.remoteURL).toEqual('sftp://localhost:9999/files/uploads/TestFileForSFTPUpload.xyz');
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
    expect(url).toEqual('sftp://localhost:9999/TestFileForSFTPUpload.xyz');

    url = client._buildUrl(`files/uploads/${remoteFileName}`);
    expect(url).toEqual('sftp://localhost:9999/files/uploads/TestFileForSFTPUpload.xyz');

    // Make sure we get rid of multiple slashes
    url = client._buildUrl(`//files////uploads//${remoteFileName}`);
    expect(url).toEqual('sftp://localhost:9999/files/uploads/TestFileForSFTPUpload.xyz');
});

test('_loadPrivateKey', () => {
    var ss = getStorageService();

    // For SFTP storage service, loginExtra is the path to the
    // private key file.
    ss.loginExtra = path.join(__dirname, '..', '..', 'test', 'certs', 'rsa_test_key');

    var client = new SFTPClient(ss);

    // Make sure it loads
    var pk = client._loadPrivateKey();
    expect(pk.startsWith('-----BEGIN RSA PRIVATE KEY-----')).toBe(true);
    expect(pk.trim().endsWith('-----END RSA PRIVATE KEY-----')).toBe(true);

    // Make sure it gets into the connection settings.
    // Note that connSettings omits password if private key is present.
    var connSettings = client._getConnSettings();
    expect(connSettings).toEqual({
        host: 'localhost',
        port: 9999,
        username: 'user',
        privateKey: pk
    });
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
    client.on('error', function(result) {
        // Force failure
        console.log(result);
        expect(result.errors).toEqual([]);
        done();
    });

    client.upload(filename, remoteFileName);
});
