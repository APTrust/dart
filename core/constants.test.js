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
    expect('/path/to/file.rar').toMatch(Constants.SERIALIZATION_FORMATS['application/x-rar-compressed']);
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

test('RE_DOMAIN', () => {
    expect('virginia.edu').toMatch(Constants.RE_DOMAIN);
    expect('homer@simpson.com').not.toMatch(Constants.RE_DOMAIN);
});

test('RE_IPV4', () => {
    expect('4.4.4.4').toMatch(Constants.RE_IPV4);
    expect('48.255.8.171').toMatch(Constants.RE_IPV4);
    expect('234.278.21.24').not.toMatch(Constants.RE_IPV4);
});

test('RE_FILE_PATH_POSIX', () => {
    expect('/home/joe/files').toMatch(Constants.RE_FILE_PATH_POSIX);
    expect('joe/files.bak/_ ~ _/junk.txt').toMatch(Constants.RE_FILE_PATH_POSIX);
    expect('/files').toMatch(Constants.RE_FILE_PATH_POSIX);
    expect('files').toMatch(Constants.RE_FILE_PATH_POSIX);
    expect('\0').not.toMatch(Constants.RE_FILE_PATH_POSIX);
});

test('RE_FILE_PATH_WINDOWS', () => {
    expect('C:\\Windows\\Path With Space\\data').toMatch(Constants.RE_FILE_PATH_WINDOWS);
    expect('\\\\ComputerName\\ShareName\\SubfolderName').toMatch(Constants.RE_FILE_PATH_WINDOWS);

    // Invalid: POSIX != Windows
    expect('/home/joe/files').not.toMatch(Constants.RE_FILE_PATH_WINDOWS);

    // Invalid: No drive letter or share path.
    expect("\\Windows\\Path With Space\\data.txt").not.toMatch(Constants.RE_FILE_PATH_WINDOWS);
});


test('RE_FILE_PATH_ANY_OS', () => {
    expect('/home/joe/files').toMatch(Constants.RE_FILE_PATH_ANY_OS);
    expect('joe/files.bak/_ ~ _/junk.txt').toMatch(Constants.RE_FILE_PATH_ANY_OS);
    expect('/files').toMatch(Constants.RE_FILE_PATH_ANY_OS);
    expect('files').toMatch(Constants.RE_FILE_PATH_ANY_OS);
    expect('C:\\Windows\\Path With Space\\data').toMatch(Constants.RE_FILE_PATH_ANY_OS);
    expect('\\\\ComputerName\\ShareName\\SubfolderName').toMatch(Constants.RE_FILE_PATH_ANY_OS);

    expect('\0').not.toMatch(Constants.RE_FILE_PATH_POSIX);

    // Invalid: No drive letter or share path.
    expect("\\Windows\\Path With Space\\data.txt").not.toMatch(Constants.RE_FILE_PATH_WINDOWS);
});
