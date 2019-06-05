const $ = require('jquery');
const { Context } = require('../../core/context');
const { InternalSetting } = require('../../core/internal_setting');
const { PluginManager } = require('../../plugins/plugin_manager');
const { SetupController } = require('./setup_controller');
const { TestUtil } = require('../../core/test_util');
const { UITestUtil } = require('../common/ui_test_util');

beforeEach(() => {
    cleanupPersistentData();
});

afterAll(() => {
    cleanupPersistentData();
});

const APTrustPluginId = 'd0a34f7f-a0f6-487b-86de-ece9b9a31189';
const DPNPluginId = 'ba6cf526-f73a-454c-b0b3-6378edc3851a';

const aptPluginName = PluginManager.findById(APTrustPluginId).constructor.name;
const dpnPluginName = PluginManager.findById(DPNPluginId).constructor.name;


function cleanupPersistentData() {
    TestUtil.deleteJsonFile('AppSetting');
    TestUtil.deleteJsonFile('BagItProfile');
    TestUtil.deleteJsonFile('InternalSetting');
    TestUtil.deleteJsonFile('RemoteRepository');
    TestUtil.deleteJsonFile('StorageService');
}

function getSetupPluginInstance(id) {
    let pluginClass = PluginManager.findById(id);
    return new pluginClass();
}

test('Constructor sets expected properties', () => {
    // Without plugin id
    let params = new URLSearchParams({ q: '5' });
    let controller = new SetupController(params)
    expect(controller.plugin).toBeNull();
    expect(controller.typedParams.q).toEqual(5); // number, not string

    params = new URLSearchParams({ id: APTrustPluginId });
    controller = new SetupController(params)
    expect(controller.pluginId).toEqual(APTrustPluginId);
    expect(controller.plugin).not.toBeNull();
    expect(controller.plugin.constructor.name).toEqual('APTrustSetup');
});

test('list()', () => {
    let controller = new SetupController(new URLSearchParams());
    let response = controller.list();
    // UITestUtil.setDocumentBody(response);

    // The content that goes into the main page container
    // should include a card for each Setup plugin.
    expect(response.container).toMatch(`#Setup/start?id=${APTrustPluginId}`);
    expect(response.container).toMatch(`#Setup/start?id=${DPNPluginId}`);
});

test('_getLastRunDate()', () => {
    let controller = new SetupController(new URLSearchParams());
    expect(controller._getLastRunDate(aptPluginName)).toBe(null);
    expect(controller._getLastRunDate(dpnPluginName)).toBe(null);

    let now = new Date();
    new InternalSetting({ name: aptPluginName, value: now }).save();
    new InternalSetting({ name: dpnPluginName, value: now }).save();
    expect(controller._getLastRunDate(aptPluginName)).toEqual(now);
    expect(controller._getLastRunDate(dpnPluginName)).toEqual(now);
});

test('_formatLastRunDate()', () => {
    let controller = new SetupController(new URLSearchParams());
    let never = Context.y18n.__('Never');
    expect(controller._formatLastRunDate(aptPluginName)).toEqual(never);
    expect(controller._formatLastRunDate(dpnPluginName)).toEqual(never);

    let now = new Date();
    let nowStr = now.toDateString();
    new InternalSetting({ name: aptPluginName, value: now }).save();
    new InternalSetting({ name: dpnPluginName, value: now }).save();
    expect(controller._formatLastRunDate(aptPluginName)).toEqual(nowStr);
    expect(controller._formatLastRunDate(dpnPluginName)).toEqual(nowStr);

});

// test('start()', () => {

// });

// test('question() first', () => {

// });

// test('question() last', () => {

// });

// test('question() with valid answer', () => {

// });

// test('question() with invalid answer', () => {

// });

// test('_showQuestion()', () => {

// });

// test('_runPreQuestionCallbacks()', () => {

// });

// test('_showError()', () => {

// });

// test('end()', () => {

// });

// test('getLogoPath()', () => {

// });

// test('postRenderCallback()', () => {

// });
