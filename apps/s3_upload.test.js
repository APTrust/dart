const CLI = require('./cli_constants');
const S3Upload = require('./s3_upload');
const { StorageService } = require('../core/storage_service');
const { TestUtil } = require('../core/test_util');

beforeEach(() => {
    TestUtil.deleteJsonFile('StorageService');
});

afterAll(() => {
    TestUtil.deleteJsonFile('StorageService');
});

var opts = {
    source: [__filename],
    dest: 'https://s3.amazonaws.com/aptrust.dart.test/s3_upload_test.js'
}

test('Constructor sets expected properties', () => {
    let s3 = new S3Upload(opts);
    expect(s3.opts.source).toEqual(opts.source);
    expect(s3.opts.dest).toEqual(opts.dest);
    expect(s3.exitCode).toEqual(CLI.EXIT_SUCCESS);
});
