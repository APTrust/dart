const { TestUtil } = require('./test_util');

test('TestUtil.deleteJsonFile does not blow up when file is missing', () => {
    expect(() => { TestUtil.deleteJsonFile('non-existent-file') }).not.toThrow(Error);
});
