const { BagItFile } = require('./bagit_file');
const { Constants } = require('../core/constants');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Util } = require('../core/util');

test('Constructor sets initial properties', () => {
    let stats = fs.statSync(__filename);
    let f = new BagItFile(__filename, 'data/bagit_file.test.js', stats);
    expect(f.absSourcePath).toEqual(__filename);
    expect(f.relDestPath).toEqual('data/bagit_file.test.js');
    expect(f.size).toEqual(stats.size);
    expect(f.uid).toEqual(stats.uid);
    expect(f.gid).toEqual(stats.gid);
    expect(f.mtime).toEqual(stats.mtime);
    expect(f.isFile).toEqual(true);
    expect(f.isDirectory).toEqual(false);
    expect(f.fileType).toEqual(Constants.PAYLOAD_FILE);
    expect(f.checksums).toEqual({});
    expect(f.keyValueCollection).toBeNull();
});

test('getManifestEntry()', () => {
    let stats = fs.statSync(__filename);
    let f = new BagItFile(__filename, 'data/bagit_file.test.js', stats);
    f.checksums['md5'] = '1234';
    f.checksums['sha256'] = '5678';
    expect(f.getManifestEntry('md5')).toEqual("1234 data/bagit_file.test.js")
    expect(f.getManifestEntry('sha256')).toEqual("5678 data/bagit_file.test.js")
    expect(() => { f.getManifestEntry('md4') }).toThrow(Error);
});

test('getFileType', () => {
    expect(BagItFile.getFileType('data/file.txt')).toEqual(Constants.PAYLOAD_FILE);
    expect(BagItFile.getFileType('manifest-md5.txt')).toEqual(Constants.PAYLOAD_MANIFEST);
    expect(BagItFile.getFileType('tagmanifest-sha256.txt')).toEqual(Constants.TAG_MANIFEST);
    expect(BagItFile.getFileType('dpn-tags/file.txt')).toEqual(Constants.TAG_FILE);
});

test('isPayloadFile', () => {
    let stats = fs.statSync(__filename);
    var f = new BagItFile('/path/to/file.txt', 'data/file.txt', stats);
    expect(f.isPayloadFile()).toEqual(true);

    f = new BagItFile('/path/to/file.txt', 'manifest-sha256.txt', stats);
    expect(f.isPayloadFile()).toEqual(false);

    f = new BagItFile('/path/to/file.txt', 'tagmanifest-sha256.txt', stats);
    expect(f.isPayloadFile()).toEqual(false);

    f = new BagItFile('/path/to/file.txt', 'custom-tags/random-tag-file.txt', stats);
    expect(f.isPayloadFile()).toEqual(false);
});

test('isPayloadManifest', () => {
    let stats = fs.statSync(__filename);
    var f = new BagItFile('/path/to/file.txt', 'data/file.txt', stats);
    expect(f.isPayloadManifest()).toEqual(false);

    f = new BagItFile('/path/to/file.txt', 'manifest-sha256.txt', stats);
    expect(f.isPayloadManifest()).toEqual(true);

    f = new BagItFile('/path/to/file.txt', 'tagmanifest-sha256.txt', stats);
    expect(f.isPayloadManifest()).toEqual(false);

    f = new BagItFile('/path/to/file.txt', 'custom-tags/random-tag-file.txt', stats);
    expect(f.isPayloadManifest()).toEqual(false);
});

test('isTagFile', () => {
    let stats = fs.statSync(__filename);
    var f = new BagItFile('/path/to/file.txt', 'data/file.txt', stats);
    expect(f.isTagFile()).toEqual(false);

    f = new BagItFile('/path/to/file.txt', 'manifest-sha256.txt', stats);
    expect(f.isTagFile()).toEqual(false);

    f = new BagItFile('/path/to/file.txt', 'tagmanifest-sha256.txt', stats);
    expect(f.isTagFile()).toEqual(false);

    f = new BagItFile('/path/to/file.txt', 'custom-tags/random-tag-file.txt', stats);
    expect(f.isTagFile()).toEqual(true);
});

test('isTagManifest', () => {
    let stats = fs.statSync(__filename);
    var f = new BagItFile('/path/to/file.txt', 'data/file.txt', stats);
    expect(f.isTagManifest()).toEqual(false);

    f = new BagItFile('/path/to/file.txt', 'manifest-sha256.txt', stats);
    expect(f.isTagManifest()).toEqual(false);

    f = new BagItFile('/path/to/file.txt', 'tagmanifest-sha256.txt', stats);
    expect(f.isTagManifest()).toEqual(true);

    f = new BagItFile('/path/to/file.txt', 'custom-tags/random-tag-file.txt', stats);
    expect(f.isTagManifest()).toEqual(false);
});

test('getCryptoHash()', done => {
    let stats = fs.statSync(__filename);
    var f = new BagItFile('/path/to/file.txt', 'data/file.txt', stats);
    var md5 = f.getCryptoHash('md5', function(data) {
        expect(data.absSourcePath).toEqual('/path/to/file.txt');
        expect(data.relDestPath).toEqual('data/file.txt');
        expect(data.algorithm).toEqual('md5');
        expect(data.digest).toEqual('d4ff2da092d09cbc0ef62428b78d13b1');
        expect(f.checksums.md5).toEqual(data.digest);
        done();
    });
    expect(typeof md5).toEqual('object');

    // Pipe in the contents of a known file, so we get a predictable digest.
    var testFile = path.join(__dirname, '..', 'test', 'fixtures', 'bag-info.txt')
    var reader = fs.createReadStream(testFile);
    reader.pipe(md5);
});
