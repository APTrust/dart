// Because require-dir and other similar libs don't work consistently
// across Jest, nexe, and Electron.
const APTrust = require('./aptrust');

module.exports.Providers = [APTrust];
