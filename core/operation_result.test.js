const dateFormat = require('dateformat');
const { OperationResult } = require('./operation_result');

let now = dateFormat(Date.now(), 'isoUtcDateTime');

function getPreFabResult() {
    let result = new OperationResult('bagging', 'bagger');
    result.started = now;
    result.completed = now;
    result.filepath = "/path/to/file.txt";
    result.filesize = 8800;
    result.fileMtime = now;
    result.remoteURL = 'https://aptrust.org';
    result.remoteChecksum = '12345678';
    result.info = 'Ned Flanders';
    result.warning = 'Come out, Neville.';
    result.error = 'There was no error.';
    result.attempt = 1;
    return result;
}

test('Constructor sets expected properties', () => {
    let result = new OperationResult('bagging', 'bagger');
    expect(result.operation).toEqual('bagging');
    expect(result.provider).toEqual('bagger');
    expect(result.attempt).toEqual(0);
    expect(result.errors).not.toBeNull();
    expect(result.errors.length).toEqual(0);
});

test('reset()', () => {
    let result = getPreFabResult();
    result.reset();

    expect(result.operation).toEqual('bagging');
    expect(result.provider).toEqual('bagger');
    expect(result.attempt).toEqual(1);
    expect(result.started).toBeNull();
    expect(result.completed).toBeNull();
    // No started/completed timestamps
    expect(result.succeeded()).toBe(false);
    expect(result.filesize).toEqual(0);
    expect(result.fileMtime).toBeNull();
    expect(result.remoteURL).toBeNull();
    expect(result.remoteChecksum).toBeNull();
    expect(result.info).toBeNull();
    expect(result.warning).toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.errors.length).toEqual(0);
});

test('start()', () => {
    let result = getPreFabResult();
    result.started = null;

    // Start should set started, increment attempt, and clear
    // most other attributes.
    result.start();
    expect(result.operation).toEqual('bagging');
    expect(result.provider).toEqual('bagger');
    expect(result.attempt).toEqual(2);
    expect(result.started).not.toBeNull();
    expect(result.completed).toBeNull();
    // No started/completed timestamps
    expect(result.succeeded()).toBe(false);
    expect(result.filesize).toEqual(0);
    expect(result.fileMtime).toBeNull();
    expect(result.remoteURL).toBeNull();
    expect(result.remoteChecksum).toBeNull();
    expect(result.info).toBeNull();
    expect(result.warning).toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.errors.length).toEqual(0);
});

test('finish()', () => {
    let result = new OperationResult('bagging', 'bagger');
    result.start();
    result.finish();
    expect(result.completed).not.toBeNull();
    expect(result.succeeded()).toBe(true);
    expect(result.errors.length).toEqual(0);

    result.finish('No friggin way, Mister Lahey!');
    expect(result.completed).not.toBeNull();
    expect(result.succeeded()).toBe(false);
    expect(result.errors.length).toEqual(1);
    expect(result.errors).toContain('No friggin way, Mister Lahey!');
});

test('first and last error', () => {
    let result = new OperationResult('bagging', 'bagger');
    expect(result.firstError()).not.toBeDefined();
    expect(result.lastError()).not.toBeDefined();

    result.errors.push('Rickey and Bubbles, get in the car.');
    result.errors.push('No friggin way, Mister Lahey!');
    expect(result.firstError()).toEqual('Rickey and Bubbles, get in the car.');
    expect(result.lastError()).toEqual('No friggin way, Mister Lahey!');
});

test('succeeded()', () => {
    let result = new OperationResult('bagging', 'bagger');
    result.attempt = 0;
    result.started = null;
    result.completed = null;
    result.errors = ['Oopsie!'];

    // No success conditions fulfilled.
    expect(result.succeeded()).toBe(false);

    // Attempted, but no start or completion time.
    result.attempt = 1;
    expect(result.succeeded()).toBe(false);

    // Not yet completed.
    result.started = new Date('2019-02-28T14:57:00');
    expect(result.succeeded()).toBe(false);

    // Has completed time, but still has errors.
    result.completed = new Date('2019-02-28T14:59:00');
    expect(result.succeeded()).toBe(false);

    // Attempted, started, completed, and no errors = success.
    result.errors = [];
    expect(result.succeeded()).toBe(true);
});

test('inflateFrom()', () => {
    let data = {
        operation: 'abc',
        provider: 'xyz'
    };
    let result = OperationResult.inflateFrom(data);

    // Should copy data attributes
    expect(result.operation).toEqual(data.operation);
    expect(result.provider).toEqual(data.provider);

    // Methods should be defined
    expect(typeof result.lastError).toEqual('function');
    expect(typeof result.succeeded).toEqual('function');
});
