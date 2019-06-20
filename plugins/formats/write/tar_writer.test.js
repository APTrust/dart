const { BagItFile } = require('../../../bagit/bagit_file');
const fs = require('fs');
const os = require('os');
const path = require('path');
const TarWriter = require('./tar_writer');
const { Util } = require('../../../core/util');

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

// absPath is the absolute path to the existing file on the filesystem
// relPath where we want to put this in the bag. E.g. data/news.pdf
function makeBagItFile(absPath, relPath) {
    let stats = fs.statSync(absPath);
    return new BagItFile(absPath, relPath, stats);
}

test('TarWriter.description() returns the basics', () => {
    var desc = TarWriter.description();
    expect(Util.looksLikeUUID(desc.id)).toEqual(true);
    expect(desc.name).toEqual("TarWriter");
    expect(desc.writesFormats.includes(".tar")).toEqual(true);
});

test('TarWriter constructor sets expected params', () => {
    var tarWriter = new TarWriter(pathToTarFile);
    expect(tarWriter.pathToTarFile).toEqual(pathToTarFile);
    expect(tarWriter.bagName).toEqual('tar_writer_test');
});

test('TarWriter adds files', done => {
    var tarWriter = new TarWriter(pathToTarFile);
    var bagItFiles = [];
    var callbacks = [];
    tarWriter.on('finish', function() {
        expect(fs.existsSync(pathToTarFile)).toEqual(true);
        var stats = fs.statSync(pathToTarFile);

        // Tar file size may vary by system
        expect(stats.size).toBeGreaterThan(1000);
        expect(stats.size).toBeLessThan(20000);

        // Check digests to ensure data was piped through.
        for (var bf of bagItFiles) {
            expect(bf.checksums.md5).toBeDefined();
            expect(bf.checksums.md5.length).toEqual(32);
            expect(bf.checksums.sha256).toBeDefined();
            expect(bf.checksums.sha256.length).toEqual(64);
        }

        for (var cb of callbacks) {
            expect(cb).toHaveBeenCalled();
        }

        expect(tarWriter.filesAdded).toEqual(bagItFiles.length);
        expect(tarWriter.filesWritten).toEqual(bagItFiles.length);
        expect(tarWriter.percentComplete()).toEqual(100);

        done();
    });

    var files = ['bag-info.txt',
                 'manifest-md5.txt',
                 'manifest-sha256.txt',
                 'tagmanifest-md5.txt',
                 'tagmanifest-sha256.txt']
    for (var f of files) {
        var absPath = path.join(__dirname, '..', '..', '..', 'test', 'fixtures', f);
        var relPath = `data/${f}`; // Always forward slash for tar, even on Windows
        var bagItFile = makeBagItFile(absPath, relPath);
        var cb1 = jest.fn(data => data != null);
        var cb2 = jest.fn(data => data != null);
        bagItFiles.push(bagItFile);
        callbacks.push(cb1, cb2);
        var cryptoHashes = [
            bagItFile.getCryptoHash('md5', cb1),
            bagItFile.getCryptoHash('sha256', cb2)
        ]
        tarWriter.add(bagItFile, cryptoHashes);
    }
});
