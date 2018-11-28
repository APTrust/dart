// Because require-dir and other similar libs don't work consistently
// across Jest, nexe, and Electron.
const { TarWriter } = require('./tar_writer');
module.exports.Providers = [TarWriter];
