const os = require('os');
const path = require('path');
const { Config } = require('./config');
const { Context } = require('./context');

const envPaths = require('env-paths');

test('Context constructor chooses correct config', () => {
    // Since this is a test, env.NODE_ENV will be set to 'test'
    expect(Context.isTestEnv).toEqual(true);
    expect(Context.config).not.toBeNull();
    expect(Context.config.datadir).toMatch(path.join('.dart-test', 'data'));
});
