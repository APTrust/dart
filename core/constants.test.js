const { Constants } = require('./constants');

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
