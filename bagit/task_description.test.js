const { TaskDescription } = require('./task_description');

test('Constructor sets initial properties', () => {
    let t = new TaskDescription('/path/to/file', 'checksum', 'Calculating md5 digest');
    expect(t.path).toEqual('/path/to/file');
    expect(t.op).toEqual('checksum');
    expect(t.msg).toEqual('Calculating md5 digest');
});
