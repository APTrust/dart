const CLI = require('./cli_constants');
const S3Upload = require('./s3_upload');
const { UploadTarget } = require('../core/upload_target');
const { TestUtil } = require('../core/test_util');

beforeEach(() => {
    TestUtil.deleteJsonFile('UploadTarget');
});

afterAll(() => {
    TestUtil.deleteJsonFile('UploadTarget');
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

test('validateOpts()', () => {
    let s3 = new S3Upload();
    expect(() => { s3.validateOpts() }).toThrow('Specify at least one file to upload.');

    s3 = new S3Upload({source: ['']});
    expect(() => { s3.validateOpts() }).toThrow('Specify at least one file to upload.');

    s3 = new S3Upload({source: ['  ']});
    expect(() => { s3.validateOpts() }).toThrow('Specify at least one file to upload.');

    s3 = new S3Upload({source: ['/file/does/not/exist/9d6831f1']});
    expect(() => { s3.validateOpts() }).toThrow('File does not exist: /file/does/not/exist/9d6831f1.');

    s3 = new S3Upload({source: [__filename]});
    expect(() => { s3.validateOpts() }).toThrow('Specify where you want to upload the file.');

    s3 = new S3Upload(opts);
    expect(() => { s3.validateOpts() }).not.toThrow();
});

test('getProvider()', () => {
    let s3 = new S3Upload(opts);
    let provider = s3.getProvider();
    expect(provider).not.toBeNull();
    expect(provider.description().name).toEqual('S3Client');
});

test('getUploadTarget() throws when it cannot find a match', () => {
    let s3 = new S3Upload(opts);
    expect(() => s3.getUploadTarget()).toThrow('Cannot find a UploadTarget record for s3.amazonaws.com.');
});

test('getUploadTarget() returns best matching S3 service', () => {
    let url = new URL(opts.dest);

    // Create some storage services in our temporary DB.
    // First one matches protocol, host, and exact bucket name.
    let exact = new UploadTarget({ name: 'Best Match' });
    exact.bucket = url.pathname;

    // Second matches host, protocol, and partial bucket name.
    let partial = new UploadTarget({ name: 'Second Best Match' });
    partial.bucket = 'aptrust.dart.test';

    // Third matches host and protocol only.
    let host = new UploadTarget({ name: 'Third Best Match' });
    [host, partial, exact].forEach(function(item) {
        item.host = url.host;
        item.protocol = 's3';
        item.save();
    });

    let s3 = new S3Upload(opts);

    // We should get an exact match, if there is one.
    let exactMatch = s3.getUploadTarget();
    expect(exactMatch).not.toBeNull();
    expect(exactMatch.name).toEqual(exact.name);
    exact.delete()

    // With no exact match, next best should be partial match.
    let partialMatch = s3.getUploadTarget();
    expect(partialMatch).not.toBeNull();
    expect(partialMatch.name).toEqual(partial.name);
    partial.delete()

    // With no exact or partial match, next best should be host match.
    let hostMatch = s3.getUploadTarget();
    expect(hostMatch).not.toBeNull();
    expect(hostMatch.name).toEqual(host.name);
});

test('initOpRecord()', () => {
    let url = new URL(opts.dest);
    let service = new UploadTarget({ name: 'S3 Service for Unit Testing' });
    service.bucket = url.pathname;
    service.host = url.host;
    service.protocol = 's3';
    service.save();

    let s3 = new S3Upload(opts);
    let op = s3.initOpRecord();
    expect(op).not.toBeNull();
    expect(op.payloadSize).toBeGreaterThan(0);
    expect(op.result).not.toBeNull();
    expect(op.result.filepath).toEqual(__filename);
    expect(op.result.filesize).toBeGreaterThan(0);
    expect(op.result.remoteURL).toEqual(opts.dest);
    expect(op.started).not.toBeNull();
    expect(op.result.attempt).toEqual(1);
});
