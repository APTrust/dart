const fs = require('fs');
const os = require('os');
const path = require('path');
const { Config } = require('./config');
const { Context } = require('./context');
const { JsonStore } = require('./json_store');

test('Context constructor chooses correct config', () => {
    // Since this is a test, env.NODE_ENV will be set to 'test'
    expect(Context.isTestEnv).toEqual(true);
    expect(Context.config).not.toBeNull();
    expect(Context.config.dataDir).toMatch(path.join('.dart-test', 'data'));
});

test('Context.db creates and returns data stores', () => {
    var test1 = Context.db('test1');
    expect(test1).not.toBeNull();
    expect(test1 instanceof JsonStore).toEqual(true);
    expect(test1.path).toEqual(path.join(Context.config.dataDir, 'test1.json'));
    expect(fs.existsSync(test1.path)).toEqual(true);
    try { fs.unlinkSync(test1.path) }
    catch (ex) { }
});

test("Context knows when it's in Electron dev mode", () => {
    expect(Context.isElectronDevMode()).toEqual(false);
});

test("Context can get package info", () => {
    var pkgInfo = Context.getPackageInfo();
    expect(pkgInfo).not.toBeNull();
    expect(pkgInfo.name).toEqual('DART');
});

test("Context can get DART version info", () => {
    var version = Context.dartVersion();
    expect(version).not.toEqual("Cannot read version from package.json file.");
    expect(version).toMatch(/^DART/);
});
