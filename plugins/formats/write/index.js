// Because require-dir and other similar libs don't work consistently
// across Jest, nexe, and Electron.
const FileSystemWriter = require('./file_system_writer');
const TarWriter = require('./tar_writer');

module.exports.Providers = [FileSystemWriter, TarWriter];
