const { Constants } = require('./constants');

test('RE_MANIFEST', () => {
    expect('manifest-md5.txt').toMatch(Constants.RE_MANIFEST);
    expect('manifest-sha256.txt').toMatch(Constants.RE_MANIFEST);

    expect('tagmanifest-sha256.txt').not.toMatch(Constants.RE_MANIFEST);
    expect('data/manifest-sha256.txt').not.toMatch(Constants.RE_MANIFEST);
});

test('RE_TAG_MANIFEST', () => {
    expect('tagmanifest-md5.txt').toMatch(Constants.RE_TAG_MANIFEST);
    expect('tagmanifest-sha256.txt').toMatch(Constants.RE_TAG_MANIFEST);

    expect('manifest-sha256.txt').not.toMatch(Constants.RE_TAG_MANIFEST);
    expect('data/tagmanifest-sha256.txt').not.toMatch(Constants.RE_TAG_MANIFEST);
});

test('Serialization format patterns', () => {
    expect('/path/to/file.tar').toMatch(Constants.SERIALIZATION_FORMATS['application/tar']);
    expect('/path/to/file.zip').toMatch(Constants.SERIALIZATION_FORMATS['application/zip']);
    expect('/path/to/file.gzip').toMatch(Constants.SERIALIZATION_FORMATS['application/gzip']);
    expect('/path/to/file.gz').toMatch(Constants.SERIALIZATION_FORMATS['application/gzip']);
    expect('/path/to/file.rar').toMatch(Constants.SERIALIZATION_FORMATS['application/x-rar']);
    expect('/path/to/file.tar.gz').toMatch(Constants.SERIALIZATION_FORMATS['application/tar+gzip']);
    expect('/path/to/file.tgz').toMatch(Constants.SERIALIZATION_FORMATS['application/tar+gzip']);

    expect('/path/to/file.tar').not.toMatch(Constants.SERIALIZATION_FORMATS['application/tar+gzip']);
    expect('/path/to/file.tar.gz').not.toMatch(Constants.SERIALIZATION_FORMATS['application/tar']);
    expect('/path/to/file.tgz').not.toMatch(Constants.SERIALIZATION_FORMATS['application/tar']);
    expect('/path/to/file.zip.txt').not.toMatch(Constants.SERIALIZATION_FORMATS['application/zip']);
});

test('RE_MAC_JUNK_FILE', () => {
    expect('.DS_Store').toMatch(Constants.RE_MAC_JUNK_FILE);
    expect('._DS_Store').toMatch(Constants.RE_MAC_JUNK_FILE);

    expect('DS_Store').not.toMatch(Constants.RE_MAC_JUNK_FILE);
    expect('_DS_Store').not.toMatch(Constants.RE_MAC_JUNK_FILE);
});

test('RE_DOT_FILE', () => {
    expect('.bash_profile').toMatch(Constants.RE_DOT_FILE);
    expect('./hidden-dir').toMatch(Constants.RE_DOT_FILE);
});

test('RE_DOT_KEEP_FILE', () => {
    expect('.keep').toMatch(Constants.RE_DOT_KEEP_FILE);
    expect('dir/.keep').toMatch(Constants.RE_DOT_KEEP_FILE);
    expect('dir\.keep').toMatch(Constants.RE_DOT_KEEP_FILE);

    expect('keep').not.toMatch(Constants.RE_DOT_KEEP_FILE);
});
