const os = require('os');
const path = require('path');
const { Config } = require('./config');

const envPaths = require('env-paths');

test('Config returns correct data', () => {
    expect(Config.user).not.toBeNull();
    expect(Config.user.homedir).toEqual(os.homedir());
    expect(Config.user.datadir).toMatch(/DART$/);

    expect(Config.test).not.toBeNull();
    expect(Config.test.homedir).toEqual(os.homedir());
    expect(Config.test.datadir).toMatch(path.join('.dart-test', 'data'));
});
