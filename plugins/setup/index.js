// Because require-dir and other similar libs don't work consistently
// across Jest, nexe, and Electron.
const APTrust = require('./aptrust');
const DPN = require('./dpn');

module.exports.Providers = [APTrust, DPN];
