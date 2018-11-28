// Because require-dir and other similar libs don't work consistently
// across Jest, nexe, and Electron.
const S3Client = require('./s3_client');

module.exports.Providers = [S3Client];
