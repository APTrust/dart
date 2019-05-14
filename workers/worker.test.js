const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { Worker } = require('./worker');

let spy = {}

beforeEach(() => {
    spy.stderr = jest.spyOn(console, 'error').mockImplementation(() => {})
    spy.stdout = jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
    spy.stderr.mockClear()
    spy.stdout.mockClear()
})

afterAll(() => {
    spy.stderr.mockRestore()
    spy.stdout.mockRestore()
})

function getLocalizedOutput(str, substring) {
    let localized = Context.y18n.__(substring);
    return str.replace(substring, localized);
}

test('Constructor sets expected properties', () => {
    let worker = new Worker('bagging');
    expect(worker.operation).toEqual('bagging');
    expect(worker.exitCode).toEqual(Constants.EXIT_SUCCESS);
});

test('info()', () => {
    let expected = getLocalizedOutput('{"op":"bagging","action":"fileAdded","msg":"Test Message","status":"In Progress","errors":[],"exception":null}', 'Test Message');
    let worker = new Worker('bagging');
    worker.info('fileAdded', Constants.OP_IN_PROGRESS, 'Test Message', false);
    expect(spy.stdout).toHaveBeenCalledTimes(1)
    expect(spy.stdout.mock.calls[0][0]).toEqual(expected);
});

test('completedSuccess()', () => {
    let expected = getLocalizedOutput('{"op":"bagging","action":"completed","msg":"Bag created","status":"Succeeded","errors":[],"exception":null}', 'Bag created');
    let worker = new Worker('bagging');
    worker.completedSuccess('Bag created');
    expect(spy.stdout).toHaveBeenCalledTimes(1)
    expect(spy.stdout.mock.calls[0][0]).toEqual(expected);
});

test('validationError', () => {
    let expected = getLocalizedOutput('{"op":"validation","action":"validate","msg":"Operation has invalid parameters.","status":"Failed","errors":["Field 1 is invalid.","Field 2 is invalid."],"exception":null}', 'Operation has invalid parameters.');
    let worker = new Worker('validation');
    worker.validationError(['Field 1 is invalid.', 'Field 2 is invalid.']);
    expect(spy.stderr).toHaveBeenCalledTimes(1)
    expect(spy.stderr.mock.calls[0][0]).toEqual(expected);
});

test('runtimeError', () => {
    let expected = getLocalizedOutput('{"op":"bagging","action":"fileAdded","msg":"Runtime error.","status":"Failed","errors":["One or more unexpected errors occurred."],"exception":{}}', "One or more unexpected errors occurred.");
    let ex = new Error('Oops!', 'source.js', 28);
    let worker = new Worker('bagging');
    worker.runtimeError('fileAdded', ['One or more unexpected errors occurred.'], ex);
    expect(spy.stderr).toHaveBeenCalledTimes(1)
    expect(spy.stderr.mock.calls[0][0]).toContain(expected);
});

test('completedWithError()', () => {
    let expected = getLocalizedOutput('{"op":"bagging","action":"completed","msg":"Operation completed with errors.","status":"Failed","errors":["Error 1","Error 2"],"exception":null}', 'Operation completed with errors.');
    let worker = new Worker('bagging');
    worker.completedWithError(['Error 1', 'Error 2']);
    expect(spy.stderr).toHaveBeenCalledTimes(1);
    expect(spy.stderr.mock.calls[0][0]).toEqual(expected);
});
