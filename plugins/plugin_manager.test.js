const FileSystemReader = require('./formats/read/file_system_reader');
const fs = require('fs');
const path = require('path');
const { PluginManager } = require('./plugin_manager');
const TarReader = require('./formats/read/tar_reader');
const TarWriter = require('./formats/write/tar_writer');

var readerDir = path.join(__dirname, "formats", "read");
var writerDir = path.join(__dirname, "formats", "write");
var fileFilter = function(f) {
    return (f != 'index.js' && f.endsWith('.js') && !f.endsWith('.test.js') &&!f.startsWith('base_writer'));
};
var readerFiles = fs.readdirSync(readerDir).filter(fileFilter);
var writerFiles = fs.readdirSync(writerDir).filter(fileFilter);


test('types()', () => {
    expect(PluginManager.types()).toEqual(['FormatReader', 'FormatWriter', 'NetworkClient', 'Repository']);
});

test('getModuleCollection()', () => {
    var readers = PluginManager.getModuleCollection('FormatReader');
    expect(readers.length).toEqual(readerFiles.length);
    expect(readers.includes(TarReader)).toEqual(true);
    expect(readers.includes(FileSystemReader)).toEqual(true);

    var writers = PluginManager.getModuleCollection('FormatWriter');
    expect(writers.length).toEqual(writerFiles.length);
    expect(writers.includes(TarWriter)).toEqual(true);
});


test('findById()', () => {
    var fsReader = PluginManager.findById('265f724e-8289-4bf7-bbdf-803a65bcdf19');
    expect(fsReader.description().name).toEqual('FileSystemReader');
});

test('canRead()', () => {
    var fsReaders = PluginManager.canRead('directory');
    expect(fsReaders.length).toEqual(1);
    expect(fsReaders[0]).toEqual(FileSystemReader);

    var tarReaders = PluginManager.canRead('.tar');
    expect(tarReaders.length).toEqual(1);
    expect(tarReaders[0]).toEqual(TarReader);

    var noReaders = PluginManager.canRead('your mind');
    expect(noReaders.length).toEqual(0);

});

test('canWrite()', () => {
    var tarWriters = PluginManager.canWrite('.tar');
    expect(tarWriters.length).toEqual(1);
    expect(tarWriters[0]).toEqual(TarWriter);
    expect(PluginManager.canWrite('.x0x0')).toEqual([]);
});

test('implementsProtocol()', () => {
    var plugins = PluginManager.implementsProtocol('s3');
    expect(plugins).toBeDefined();
    expect(plugins.length).toBeGreaterThan(0);
    var foundS3Client = false;
    for (var plugin of plugins) {
        if (plugin.description().name === 'S3Client') {
            foundS3Client = true;
        }
    }
    expect(foundS3Client).toEqual(true);
});

test('talksTo()', () => {
    var plugins = PluginManager.talksTo('aptrust');
    expect(plugins).toBeDefined();
    expect(plugins.length).toBeGreaterThan(0);
    var foundAPTrustClient = false;
    for (var plugin of plugins) {
        if (plugin.description().name === 'APTrustClient') {
            foundAPTrustClient = true;
        }
    }
    expect(foundAPTrustClient).toEqual(true);
});
