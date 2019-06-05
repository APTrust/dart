const $ = require('jquery');
const { Constants } = require('../../core/constants');
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

// The Demo Login Email Address question is at index 6 in the
// list of APTrust setup questions.
const demoLogin = 6;

function getParams(questionNumber = null, dir = 'next') {
    let params = new URLSearchParams({
        id: APTrustPluginId,
        dir: dir
    });
    if (questionNumber != null) {
        params.set('q', questionNumber);
    }
    return params;
}

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

function testQuestion(qNumber) {
    let plugin = getSetupPluginInstance(APTrustPluginId);

    // Need to install objects first for question mappings to work.
    plugin.installSettings();

    let question = plugin.getQuestions()[qNumber];
    let controller = new SetupController(getParams(qNumber));
    let response = controller.question();
    expect(response.container).toMatch(question.heading);
    expect(response.container).toMatch(question.label);

    // Return response so caller can run additional tests.
    return response;
}

function testForMessage(msgName) {
    let plugin = getSetupPluginInstance(APTrustPluginId);
    let message = plugin.getMessage(msgName);
    let controller = new SetupController(getParams());
    controller.plugin.installSettings(); // to prevent error
    let response;
    if (msgName == 'start') {
        response = controller.start();
    } else {
        response = controller.end();
    }
    expect(response.container).toMatch(message);
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

test('start()', () => {
    testForMessage('start');
});

test('question() renders question', () => {
    // Test questions that don't have requirements
    let response = testQuestion(0);  // organization
    expect(response.container).toMatch('type="text" id="q_organization"');

    response = testQuestion(5);  // demo secret key
    response = testQuestion(11); // prod api key
});

test('question() last links to end message', () => {
    let response = testQuestion(11);
    expect(response.container).toMatch('#Setup/end');
});

test('question() with valid answer', () => {
    // The demoLogin question requires an email address.
    // Get the question HTML and put it in the document body.
    let response = testQuestion(demoLogin)
    UITestUtil.setDocumentBody(response);

    // Use jQuery to set a valid response to the question.
    $('#q_pharos_demo_login').val('user@example.com');

    // Now ensure that when we try to move on to the next
    // question, the controller actually displays it.
    // If our answer to the email question were invalid,
    // the controller would redisplay the email question
    // with an error message.
    testQuestion(demoLogin + 1);
});

test('question() runs callback after valid answer', () => {
    let response = testQuestion(demoLogin)
    UITestUtil.setDocumentBody(response);
    $('#q_pharos_demo_login').val('user@example.com');

    // After supplying a valid response, controller should call
    // plugin.afterEachQuestion() before it displays the next
    // question.
    let controller = new SetupController(getParams(demoLogin + 1));

    // Controller passes in the question we just answered, which
    // should have our response in the .value field. The validation
    // regexp is filled in at runtime by DART.
    let demoLoginQuestion = controller.plugin.getQuestions()[demoLogin];
    demoLoginQuestion.value = "user@example.com";
    demoLoginQuestion.validation.regexp = Constants.RE_EMAIL;

    controller.plugin.afterEachQuestion = jest.fn((q) => {});
    response = controller.question();
    expect(controller.plugin.afterEachQuestion).toHaveBeenCalledWith(demoLoginQuestion);
});


test('question() with invalid answer', () => {
    // See comments in test immediately above.
    let response = testQuestion(demoLogin)
    UITestUtil.setDocumentBody(response);

    // Use jQuery to set an invalid response to the question.
    $('#q_pharos_demo_login').val('invalid address!!');

    // Now when we try to move on to the next
    // question, the controller should instead display the
    // demoLogin question again with a message saying our
    // response was invalid.
    let plugin = getSetupPluginInstance(APTrustPluginId);
    let demoLoginQuestion = plugin.getQuestions()[demoLogin];
    let controller = new SetupController(getParams(demoLogin + 1));
    response = controller.question();
    expect(response.container).toMatch(demoLoginQuestion.heading);
    expect(response.container).toMatch(demoLoginQuestion.label);

    // Make sure the validation error is showing.
    let errMessage = Context.y18n.__(demoLoginQuestion.errMessage);
    expect(response.container).toMatch(errMessage);
});

test('question() does not run callback after invalid answer', () => {
    let response = testQuestion(demoLogin)
    UITestUtil.setDocumentBody(response);
    $('#q_pharos_demo_login').val('This answer is not valid');

    let controller = new SetupController(getParams(demoLogin + 1));
    controller.plugin.afterEachQuestion = jest.fn((q) => {});
    response = controller.question();
    expect(controller.plugin.afterEachQuestion).not.toHaveBeenCalled();
});


test('runPreQuestionCallbacks()', () => {
    let controller = new SetupController(getParams())
    controller.plugin.beforeObjectInstallation = jest.fn();
    controller.plugin.installSettings = jest.fn();
    controller.plugin.beforeAllQuestions = jest.fn();

    controller.runPreQuestionCallbacks();
    expect(controller.plugin.beforeObjectInstallation).toHaveBeenCalled();
    expect(controller.plugin.installSettings).toHaveBeenCalled();
    expect(controller.plugin.beforeAllQuestions).toHaveBeenCalled();
});

test('startQuestions() calls runPreQuestionCallbacks and _showQuestion', () => {
    let controller = new SetupController(getParams())
    controller.runPreQuestionCallbacks = jest.fn();
    controller._showQuestion = jest.fn();
    let response = controller.startQuestions();
    expect(controller.runPreQuestionCallbacks).toHaveBeenCalled();
    expect(controller._showQuestion).toHaveBeenCalled();
});

test('startQuestions() with error', () => {
    let controller = new SetupController(getParams())
    controller.plugin.installSettings = jest.fn(() => { throw new Error('Test Error')} );
    let response = controller.startQuestions();
    expect(response.container).toMatch('Test Error');
});

test('_showError()', () => {
    let error = new Error("Release the hounds");
    let controller = new SetupController(getParams())
    let response = controller._showError(error);
    expect(response.container).toMatch("Release the hounds");
});

test('end()', () => {
    testForMessage('end');
});

test('getLogoPath()', () => {
    let controller = new SetupController(getParams())
    expect(controller.getLogoPath(controller.plugin.settingsDir)).toMatch(/logo\.png/);
});
