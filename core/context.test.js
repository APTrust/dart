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

test("Context knows when we're running inside Electron", () => {
    expect(Context.electronIsRunning()).toEqual(false);
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

test("Context can get DART release number", () => {
    var version = Context.dartReleaseNumber();
    expect(version).not.toEqual("0.0.0");
    expect(version).toMatch(/\d+/);
});

test("We should be able to write to the log", () => {
    expect(Context.logger).not.toBeNull();
    expect(Context.logger).toBeDefined();
    expect(function() { Context.logger.silly("Test silly message") }).not.toThrow();
    expect(function() { Context.logger.debug("Test debug message") }).not.toThrow();
    expect(function() { Context.logger.verbose("Test verbose message") }).not.toThrow();
    expect(function() { Context.logger.info("Test info message") }).not.toThrow();
    expect(function() { Context.logger.warn("Test warning message") }).not.toThrow();
    expect(function() { Context.logger.error("Test error message") }).not.toThrow();
});

test("Context has y18n", () => {
    expect(Context.y18n).toBeDefined();
    expect(Context.y18n.directory).toEqual(path.join(__dirname, '..', 'locales'));
    expect(Context.y18n.locale).toBeDefined();
    expect(Context.y18n.locale.length).toBeGreaterThan(1);
});

test("slowMotionDelay is off", () => {
    if (Context.slowMotionDelay != 0) {
        console.log("When Context.slowMotionDelay is set above 0, some bagging and validation tests will fail. Set it back to 0 during tests!");
    }
    expect(Context.slowMotionDelay).toEqual(0);
});
