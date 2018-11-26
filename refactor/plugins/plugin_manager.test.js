const FileSystemReader = require('./formats/read/file_system_reader');
const { PluginManager } = require('./plugin_manager');
const TarReader = require('./formats/read/file_system_reader');

test('types()', () => {
    expect(PluginManager.types()).toEqual(['FormatReader', 'FormatWriter', 'NetworkClient', 'Repository', 'Setup']);
});

// TODO: Write these!

// test('getModuleCollection()', () => {

// });

// test('listByType()', () => {

// });

test('findById()', () => {
    var fsReader = PluginManager.findById('265f724e-8289-4bf7-bbdf-803a65bcdf19');
    expect(fsReader.description().name).toEqual('FileSystemReader');
});

test('canRead()', () => {
    var fsReaders = PluginManager.canRead('directory');
    expect(fsReaders.length).toEqual(1);
    expect(fsReaders[0].description().name).toEqual('FileSystemReader');

    var tarReaders = PluginManager.canRead('.tar');
    expect(tarReaders.length).toEqual(1);
    expect(tarReaders[0].description().name).toEqual('TarReader');

    var noReaders = PluginManager.canRead('i-am-javascript-i-am-unreadable');
    expect(noReaders.length).toEqual(0);

});

// test('canWrite()', () => {

// });

// test('implementsProtocol()', () => {

// });

// test('talksTo()', () => {

// });

// test('setsUp()', () => {

// });

test('pluginProvides()', () => {

});
