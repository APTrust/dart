const { FileStat } = require('./filestat');

function getOpts() {
    return {
        size: 500,
        mode: 0o755,
        uid: 123,
        gid: 456,
        mtimeMs: new Date(Date.UTC(2018, 10, 24, 22, 0, 0)),
        isTypeFile: true,
        isTyprDir: false,
        throwAway: 'This value should be ignored'
    }
}

test('Constructor sets expected properties', () => {
    let opts = getOpts();
    let obj = new FileStat(opts)
    expect(obj.size).toEqual(opts.size);
    expect(obj.mode).toEqual(opts.mode);
    expect(obj.uid).toEqual(opts.mode);
    expect(obj.gid).toEqual(opts.mode);
    expect(obj.mtimeMs).toEqual(opts.mode);
    expect(obj.isTypeFile).toEqual(opts.mode);
    expect(obj.isTypeDir).toEqual(opts.mode);
    expect(obj.throwAway).toBeUndefined();
});
