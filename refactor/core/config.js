const envPaths = require('env-paths');
const os = require('os');
const path = require('path');

const dartPaths = envPaths('DART', { suffix: ''});
const homedir = os.homedir();

/**
 * defaultConfig contains config settings for running the electron app
 * and command-line apps as a user. These are the settings you'll want
 * to use in all cases except unit tests.
 *
 * @property {string} homedir - Path to the current user's home directory.
 * @property {string} datadir - Path to directory where the current application stores its data.
 * @property {string} logdir  - Path to directory where the current application stores its logs.
 * @property {string} tempdir - Path to directory where the current application stores temp files.
 */
const userConfig = {
    homedir: homedir,
    datadir: dartPaths.data,
    logdir: dartPaths.log,
    tempdir: dartPaths.temp
}

/**
 * testConfig contains config settings for running automated tests.
 *
 * @property {string} homedir - Path to the current user's home directory.
 * @property {string} datadir - Path to directory where the current application stores its data.
 * @property {string} logdir  - Path to directory where the current application stores its logs.
 * @property {string} tempdir - Path to directory where the current application stores temp files.
 */
const testConfig = {
    homedir: homedir,
    datadir: path.join(homedir, '.dart-test', 'data'),
    logdir: path.join(homedir, '.dart-test', 'log'),
    tempdir: path.join(homedir, '.dart-test', 'tmp')
}

const Config = {
    'user': userConfig,
    'test': testConfig
}

module.exports.Config = Config;
