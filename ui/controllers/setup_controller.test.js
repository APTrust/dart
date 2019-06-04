const $ = require('jquery');
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

// test('list()', () => {
//     let controller = new SetupController(new URLSearchParams());
//     let response = controller.list();
//     UITestUtil.setDocumentBody(response);
// });

// test('_getLastRunDate()', () => {

// });

// test('_formatLastRunDate()', () => {

// });

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
