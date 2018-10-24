const { FileStat } = require('./filestat');

function getOpts() {
    return {
        size: 500,
        mode: 0o755,
        uid: 123,
        gid: 456,
        mtimeMs: new Date(Date.UTC(2018, 10, 24, 22, 0, 0)),
        isTypeFile: true,
        isTypeDir: false,
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
    expect(obj.isTypeFile).toEqual(false);
    expect(obj.isTypeDir).toEqual(false);
});

test('Constructor sets expected properties', () => {
    let opts = getOpts();
    let obj = new FileStat(opts)
    expect(obj.size).toEqual(opts.size);
    expect(obj.mode).toEqual(opts.mode);
    expect(obj.uid).toEqual(opts.uid);
    expect(obj.gid).toEqual(opts.gid);
    expect(obj.mtimeMs).toEqual(opts.mtimeMs);
    expect(obj.isTypeFile).toEqual(opts.isTypeFile);
    expect(obj.isTypeDir).toEqual(opts.isTypeDir);

    opts.IsTypeFile = false;
    opts.IsTypeDir = true;
    let obj2 = new FileStat(opts)
    expect(obj2.isTypeFile).toEqual(opts.isTypeFile);
    expect(obj2.isTypeDir).toEqual(opts.isTypeDir);
});

test('Constructor ignores unexpected properties', () => {
    let opts = getOpts();
    let obj = new FileStat(opts)
    expect(obj.throwAway).toBeUndefined();
});

test('IsFile and IsDirectory return correct values', () => {
    let obj = new FileStat()

    obj.isTypeFile = false;
    obj.isTypeDir = false;
    expect(obj.isFile()).toEqual(false);
    expect(obj.isDirectory()).toEqual(false);

    obj.isTypeFile = true;
    obj.isTypeDir = true;
    expect(obj.isFile()).toEqual(true);
    expect(obj.isDirectory()).toEqual(true);
});
