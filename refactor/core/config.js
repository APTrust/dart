const envPaths = require('env-paths');
const os = require('os');
const path = require('path');

const dartPaths = envPaths('DART', { suffix: ''});
const homedir = os.homedir();

/**
 * defaultConfig contains config settings for running the electron app
 * and command-line apps as a user. These are the settings you'll want
 * to use in all cases except unit tests.
 */
const userConfig = {
    homedir: homedir,
    datadir: dartPaths.data,
    logdir: dartPaths.log,
    tempdir: dartPaths.temp
}

/**
 * testConfig contains config settings for running automated tests.
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
