// Because require-dir and other similar libs don't work consistently
// across Jest, nexe, and Electron.
const FileSystemReader = require('./file_system_reader');
const TarReader = require('./tar_reader');

module.exports.Providers = [FileSystemReader, TarReader];
