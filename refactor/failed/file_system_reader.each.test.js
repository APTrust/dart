const path = require('path');
const { PassThrough } = require('stream');
const { FileSystemReader } = require('./file_system_reader.each');

test('FileSystemReader.read() emits expected events', done => {
    var streamCount = 0;
    var finishCount = 0;
    var dir = path.join(__dirname, "..", "test")
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
    fsReader.on('finish', function(fileCount) {
        finishCount = fileCount;
        expect(streamCount).toEqual(0);
        expect(finishCount).toEqual(0);
        expect(fsReader.fileCount).toEqual(0);
        expect(fsReader.dirCount).toEqual(0);
        done();
    });

    fsReader.read();
});
