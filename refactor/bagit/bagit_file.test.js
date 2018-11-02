const { BagItFile } = require('./bagit_file');
const { Constants } = require('../core/constants');
const { Util } = require('../core/util');
const fs = require('fs');
const path = require('path');

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
