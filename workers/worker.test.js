const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const { Worker } = require('./worker');

test('Constructor sets expected properties', () => {
    let worker = new Worker('bagging');
    expect(worker.operation).toEqual('bagging');
    expect(worker.exitCode).toEqual(Constants.EXIT_SUCCESS);
});

test('info()', done => {
    let worker = new Worker('bagging');
    worker.on('message', function (jobStatus) {
        expect(jobStatus.op).toEqual('bagging');
        expect(jobStatus.action).toEqual('fileAdded');
        expect(jobStatus.msg).toEqual('Test Message');
        expect(worker.exitCode).toEqual(Constants.EXIT_SUCCESS);
        done();
    });
    worker.info('fileAdded', Constants.OP_IN_PROGRESS, 'Test Message', false);
});

test('completedSuccess()', done => {
    let worker = new Worker('bagging');
    worker.on('message', function (jobStatus) {
        expect(jobStatus.op).toEqual('bagging');
        expect(jobStatus.action).toEqual('completed');
        expect(jobStatus.msg).toEqual('Bag created');
        expect(worker.exitCode).toEqual(Constants.EXIT_SUCCESS);
        done();
    });
    worker.completedSuccess('Bag created');
});

test('validationError', done => {
    let errors = ['Field 1 is invalid.', 'Field 2 is invalid.'];
    let worker = new Worker('validation');
    worker.on('message', function (jobStatus) {
        expect(jobStatus.op).toEqual('validation');
        expect(jobStatus.action).toEqual('validate');
        expect(jobStatus.errors).toEqual(errors);
        expect(worker.exitCode).toEqual(Constants.EXIT_INVALID_PARAMS);
        done();
    });
    worker.validationError(errors);
});

test('runtimeError', done => {
    let errors = ['One or more unexpected errors occurred.'];
    let ex = new Error('Oops!', 'source.js', 28);
    let worker = new Worker('bagging');
    worker.on('message', function (jobStatus) {
        expect(jobStatus.op).toEqual('bagging');
        expect(jobStatus.action).toEqual('fileAdded');
        expect(jobStatus.errors).toEqual(errors);
        expect(jobStatus.exception).toEqual(ex);
        expect(worker.exitCode).toEqual(Constants.EXIT_RUNTIME_ERROR);
        done();
    });
    worker.runtimeError('fileAdded', errors, ex);
});

test('completedWithError()', done => {
    let errors = ['Error 1', 'Error 2']
    let worker = new Worker('bagging');
    worker.on('message', function (jobStatus) {
        expect(jobStatus.op).toEqual('bagging');
        expect(jobStatus.action).toEqual('completed');
        expect(jobStatus.errors).toEqual(errors);
        expect(worker.exitCode).toEqual(Constants.EXIT_COMPLETED_WITH_ERRORS);
        done();
    });
    worker.completedWithError(errors);
});
