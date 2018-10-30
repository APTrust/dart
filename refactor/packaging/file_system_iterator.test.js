const path = require('path');
const { PassThrough } = require('stream');
const { FileSystemIterator } = require('./file_system_iterator');

// Apologies to all maintainers.
// These tests run against the test directory, so as the number
// of test fixtures, bags and profiles changes, this number will
// have to change too.
const FILES_IN_TEST_DIR = 29;
const DIRS_IN_TEST_DIR = 5;

test('FileSystemIterator.read() emits expected events', done => {
    var streamCount = 0;
    var finishCount = 0;
    var dir = path.join(__dirname, "..", "test")
    var fsIterator = new FileSystemIterator(dir);

    // Count the number of stream events.
    fsIterator.on('entry', function(relPath, fileStat, stream) {
        expect(relPath).not.toBeNull();
        expect(fileStat).not.toBeNull();
        expect(stream).not.toBeNull();
        streamCount++;
        stream.pipe(new PassThrough());
    });

    // Set finishCount to the number of files the
    // tarIterator thinks it read. This tells us
    // 1) that the finish event fired (because finishCount is non-zero) and
    // 2) that we got a stream event for every file (if finishCount equals streamCount below)
    fsIterator.on('finish', function(fileCount) {
        finishCount = fileCount;
        expect(streamCount).toEqual(FILES_IN_TEST_DIR + DIRS_IN_TEST_DIR);
        expect(finishCount).toEqual(FILES_IN_TEST_DIR);
        expect(fsIterator.fileCount).toEqual(FILES_IN_TEST_DIR);
        expect(fsIterator.dirCount).toEqual(DIRS_IN_TEST_DIR);
        done();
    });

    fsIterator.read();
});

test('FileSystemIterator.read() returns expected stats', done => {
    var dir = path.join(__dirname, "..", "test")
    var fsIterator = new FileSystemIterator(dir);
    var foundTestFile = false;

    // Count the number of stream events.
    fsIterator.on('entry', function(relPath, fileStat, stream) {
        if (relPath === "bags/aptrust/example.edu.tagsample_good.tar") {
            foundTestFile = true;
            expect(fileStat.size).toEqual(40960);
            expect(fileStat.mtimeMs).not.toEqual(0);
            expect(fileStat.isFile()).toEqual(true);

            // Make sure we can actually read the contents...
            var fileContents = [];
            stream.on('data', function(chunk) {
                fileContents.push(chunk);
            });
            stream.on('end', function() {
                var binaryData = Buffer.concat(fileContents);
                expect(binaryData.length).toEqual(fileStat.size);
            });
        }
        stream.pipe(new PassThrough());
    });

    fsIterator.on('finish', function(fileCount) {
        expect(foundTestFile).toEqual(true);
        done();
    });

    fsIterator.read();
});

test('FileSystemIterator.list() emits expected events with correct stats', done => {
    var streamCount = 0;
    var finishCount = 0;
    var dir = path.join(__dirname, "..", "test")
    var fsIterator = new FileSystemIterator(dir);

    // Note there's no stream here, because we're just listing.
    fsIterator.on('entry', function(relPath, fileStat) {
        expect(relPath).not.toBeNull();
        expect(fileStat).not.toBeNull();
        streamCount++;
    });

    fsIterator.on('finish', function(fileCount) {
        finishCount = fileCount;
        expect(streamCount).toEqual(FILES_IN_TEST_DIR + DIRS_IN_TEST_DIR);
        expect(finishCount).toEqual(FILES_IN_TEST_DIR);
        expect(fsIterator.fileCount).toEqual(FILES_IN_TEST_DIR);
        expect(fsIterator.dirCount).toEqual(DIRS_IN_TEST_DIR);
        done();
    });

    fsIterator.list();
});
