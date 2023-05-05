const os = require('os');
const path = require('path');
const { Config } = require('./config');


test('Config returns correct data', () => {
    expect(Config.user).not.toBeNull();
    expect(Config.user.homeDir).toEqual(os.homedir());

    if (os.platform() === 'win32') {
        expect(Config.user.dataDir).toMatch(/DART\\Data/);
    } else {
        expect(Config.user.dataDir).toMatch(/DART$/);
    }

    expect(Config.test).not.toBeNull();
    expect(Config.test.homeDir).toEqual(os.homedir());
    expect(Config.test.dataDir).toMatch(path.join('.dart-test', 'data'));
});
