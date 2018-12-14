const { OperationResult } = require('./operation_result');

test('Constructor sets expected properties', () => {
    let result = new OperationResult('bagging', 'bagger');
    expect(result.operation).toEqual('bagging');
    expect(result.provider).toEqual('bagger');
    expect(result.attemptNumber).toEqual(0);
    expect(result.errors).not.toBeNull();
    expect(result.errors.length).toEqual(0);
});

test('reset()', () => {
    let now = new Date();
    let result = new OperationResult('bagging', 'bagger');
    result.started = now;
    result.completed = now;
    result.succeeded = true;
    result.filename = "/path/to/file.txt";
    result.filesize = 8800;
    result.fileMtime = now;
    result.remoteUrl = 'https://aptrust.org';
    result.remoteChecksum = '12345678';
    result.info = 'Ned Flanders';
    result.warning = 'Come out, Neville.';
    result.error = 'There was no error.';
    result.attemptNumber = 1;

    result.reset();

    expect(result.operation).toEqual('bagging');
    expect(result.provider).toEqual('bagger');
    expect(result.attemptNumber).toEqual(1);
    expect(result.started).toBeNull();
    expect(result.completed).toBeNull();
    expect(result.succeeded).toEqual(false);
    expect(result.filename).toBeNull();
    expect(result.filesize).toEqual(0);
    expect(result.fileMtime).toBeNull();
    expect(result.remoteUrl).toBeNull();
    expect(result.remoteChecksum).toBeNull();
    expect(result.info).toBeNull();
    expect(result.warning).toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.errors.length).toEqual(0);
});
