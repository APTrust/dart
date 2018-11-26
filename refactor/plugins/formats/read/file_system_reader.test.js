const path = require('path');
const { PassThrough } = require('stream');
const { FileSystemReader } = require('./file_system_reader');

// Apologies to all maintainers.
// These tests run against the test directory, so as the number
// of test fixtures, bags and profiles changes, this number will
// have to change too.
const FILES_IN_TEST_DIR = 8;
const DIRS_IN_TEST_DIR = 1;

test('FileSystemReader.read() emits expected events', done => {
    var streamCount = 0;
    var finishCount = 0;
    var dir = path.join(__dirname, "..", "..", "..", "test", "bags", "aptrust", "example.edu.sample_good")
    var fsReader = new FileSystemReader(dir);

    // Count the number of stream events.
    fsReader.on('entry', function(entry) {
        expect(entry.relPath).not.toBeNull();
        expect(entry.fileStat).not.toBeNull();
        expect(entry.stream).not.toBeNull();
        streamCount++;
        entry.stream.pipe(new PassThrough());
    });

    // Set finishCount to the number of files the
    // tarReader thinks it read. This tells us
    // 1) that the finish event fired (because finishCount is non-zero) and
    // 2) that we got a stream event for every file (if finishCount equals streamCount below)
    fsReader.on('end', function(fileCount) {
        finishCount = fileCount;
        expect(streamCount).toEqual(FILES_IN_TEST_DIR + DIRS_IN_TEST_DIR);
        expect(finishCount).toEqual(FILES_IN_TEST_DIR);
        expect(fsReader.fileCount).toEqual(FILES_IN_TEST_DIR);
        expect(fsReader.dirCount).toEqual(DIRS_IN_TEST_DIR);
        done();
    });

    fsReader.read();
});

test('FileSystemReader.read() returns expected stats', done => {
    var dir = path.join(__dirname, "..", "..", "..", "test")
    var fsReader = new FileSystemReader(dir);
    var foundTestFile = false;

    // Count the number of stream events.
    fsReader.on('entry', function(entry) {
        if (entry.relPath === "bags/aptrust/example.edu.tagsample_good.tar") {
            foundTestFile = true;
            expect(entry.fileStat.size).toEqual(32768);
            expect(entry.fileStat.mtimeMs).not.toEqual(0);
            expect(entry.fileStat.isFile()).toEqual(true);

            // Make sure we can actually read the contents...
            var fileContents = [];
            entry.stream.on('data', function(chunk) {
                fileContents.push(chunk);
            });
            entry.stream.on('end', function() {
                var binaryData = Buffer.concat(fileContents);
                expect(binaryData.length).toEqual(entry.fileStat.size);
            });
        }
        entry.stream.pipe(new PassThrough());
    });

    fsReader.on('end', function(fileCount) {
        expect(foundTestFile).toEqual(true);
        done();
    });

    fsReader.read();
});

test('FileSystemReader.list() emits expected events with correct stats', done => {
    var streamCount = 0;
    var finishCount = 0;
    var dir = path.join(__dirname, "..", "..", "..", "test", "bags", "aptrust", "example.edu.sample_good")
    var fsReader = new FileSystemReader(dir);

    // Note there's no stream here, because we're just listing.
    fsReader.on('entry', function(entry) {
        expect(entry.relPath).not.toBeNull();
        expect(entry.fileStat).not.toBeNull();
        streamCount++;
    });

    fsReader.on('end', function(fileCount) {
        finishCount = fileCount;
        expect(streamCount).toEqual(FILES_IN_TEST_DIR + DIRS_IN_TEST_DIR);
        expect(finishCount).toEqual(FILES_IN_TEST_DIR);
        expect(fsReader.fileCount).toEqual(FILES_IN_TEST_DIR);
        expect(fsReader.dirCount).toEqual(DIRS_IN_TEST_DIR);
        done();
    });

    fsReader.list();
});
