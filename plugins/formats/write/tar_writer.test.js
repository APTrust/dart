const fs = require('fs');
const os = require('os');
const path = require('path');
const TarWriter = require('./tar_writer');

var pathToTarFile;

beforeEach(() => {
    var tmpDir = os.tmpdir();
    var fileName = 'tar_writer_test.tar';
    pathToTarFile = path.join(tmpDir, fileName);
});

afterEach(() => {
    if (fs.existsSync(pathToTarFile)) {
        fs.unlinkSync(pathToTarFile);
    }
});


test('TarWriter constructor sets expected params', () => {
    var tarWriter = new TarWriter(pathToTarFile);
    expect(tarWriter.pathToTarFile).toEqual(pathToTarFile);
    expect(tarWriter.bagName).toEqual('tar_writer_test');
});
