const { BagItFile } = require('../../../bagit/bagit_file');
const FileSystemWriter = require('./file_system_writer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Util } = require('../../../core/util');

var tmpDir = os.tmpdir();
var fileName = 'fs_test';
var pathToOutputDir = path.join(tmpDir, fileName);

afterEach(() => {
    if (fs.existsSync(pathToOutputDir) && pathToOutputDir.startsWith(tmpDir)) {
        Util.deleteRecursive(pathToOutputDir);
    }
});

// absPath is the absolute path to the existing file on the filesystem
// relPath where we want to put this in the bag. E.g. data/news.pdf
function makeBagItFile(absPath, relPath) {
    let stats = fs.statSync(absPath);
    return new BagItFile(absPath, relPath, stats);
}

test('FileSystemWriter.description() returns the basics', () => {
    var desc = FileSystemWriter.description();
    expect(Util.looksLikeUUID(desc.id)).toEqual(true);
    expect(desc.name).toEqual("FileSystemWriter");
    expect(desc.writesFormats.includes("directory")).toEqual(true);
});

test('FileSystemWriter constructor sets expected params', () => {
    var fsWriter = new FileSystemWriter(pathToOutputDir);
    expect(fsWriter.pathToOutputDir).toEqual(pathToOutputDir);
});

test('FileSystemWriter adds files', done => {
    var fsWriter = new FileSystemWriter(pathToOutputDir);
    var bagItFiles = [];
    var callbacks = [];
    fsWriter.on('finish', function() {
        expect(fs.existsSync(pathToOutputDir)).toEqual(true);
        expect(fs.existsSync(path.join(pathToOutputDir, 'data'))).toEqual(true);

        // Ensure files were written and digests calculated.
        for (var bf of bagItFiles) {
            let destPath = path.join(pathToOutputDir, bf.relDestPath)
            expect(fs.existsSync(destPath)).toEqual(true);
            let stats = fs.statSync(destPath);
            expect(Number(stats.size)).toEqual(bf.size);
            expect(bf.checksums.md5).toBeDefined();
            expect(bf.checksums.md5.length).toEqual(32);
            expect(bf.checksums.sha256).toBeDefined();
            expect(bf.checksums.sha256.length).toEqual(64);
        }

        expect(fsWriter.filesAdded).toEqual(bagItFiles.length);
        expect(fsWriter.filesWritten).toEqual(bagItFiles.length);
        expect(fsWriter.percentComplete()).toEqual(100);

        for (var cb of callbacks) {
            expect(cb).toHaveBeenCalled();
        }
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
        fsWriter.add(bagItFile, cryptoHashes);
    }
});
