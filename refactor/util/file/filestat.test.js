const { FileStat } = require('./filestat');

function getOpts() {
    return {
        size: 500,
        mode: 0o755,
        uid: 123,
        gid: 456,
        mtimeMs: new Date(Date.UTC(2018, 10, 24, 22, 0, 0)),
        type: 'file',
        throwAway: 'This value should be ignored'
    }
}

test('Constructor sets expected defaults', () => {
    let obj = new FileStat()
    expect(obj.size).toEqual(-1);
    expect(obj.mode).toEqual(0o400);
    expect(obj.uid).toEqual(0);
    expect(obj.gid).toEqual(0);
    expect(obj.mtimeMs).toEqual(new Date(Date.UTC(0, 0, 0, 0, 0, 0)));
    expect(obj.type).toEqual("unknown");
});

test('Constructor sets expected properties', () => {
    let opts = getOpts();
    let obj = new FileStat(opts)
    expect(obj.size).toEqual(opts.size);
    expect(obj.mode).toEqual(opts.mode);
    expect(obj.uid).toEqual(opts.uid);
    expect(obj.gid).toEqual(opts.gid);
    expect(obj.mtimeMs).toEqual(opts.mtimeMs);
    expect(obj.type).toEqual(opts.type);
});

test('Constructor ignores unexpected properties', () => {
    let opts = getOpts();
    let obj = new FileStat(opts)
    expect(obj.throwAway).toBeUndefined();
});

test('IsFile and IsDirectory return correct values', () => {
    let obj = new FileStat()

    obj.type = "file";
    expect(obj.isFile()).toEqual(true);
    expect(obj.isDirectory()).toEqual(false);

    obj.type = "directory";
    expect(obj.isFile()).toEqual(false);
    expect(obj.isDirectory()).toEqual(true);
});
