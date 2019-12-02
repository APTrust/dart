const SFTPServer = require('./sftp_server');
const SFTPClient = require('./sftp_client');
const { StorageService } = require('../../core/storage_service');

var server = null;

beforeAll(() => {
    server = SFTPServer.start(SFTPServer.PORT);
});

afterAll(() => {
    server.stop();
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
        // TODO: Test the result
        done();
    });
    client.on('error', function(err) {
        // Force failure
        expect(err).toBeNull();
        done();
    });

    client.upload(__filename, 'TestFileForSFTPUpload.xyz');
});
