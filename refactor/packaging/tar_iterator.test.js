const path = require('path');
const { PassThrough } = require('stream');
const { TarIterator } = require('./tar_iterator');

test('TarIterator emits expected events', done => {
    var streamCount = 0;
    var finishCount = 0;
    var pathToTarFile = path.join(__dirname, "..", "test", "bags", "aptrust", "example.edu.sample_good.tar")
    var tarIterator = new TarIterator(pathToTarFile);

    // Count the number of stream events.
    tarIterator.on('entry', function(fileStat, stream) {
        streamCount++;
        stream.pipe(new PassThrough());
    });

    // Set finishCount to the number of files the
    // tarIterator thinks it read. This tells us
    // 1) that the finish event fired (because finishCount is non-zero) and
    // 2) that we got a stream event for every file (if finishCount equals streamCount below)
    tarIterator.on('finish', function(fileCount) {
        finishCount = fileCount;
        expect(streamCount).toEqual(10);
        expect(finishCount).toEqual(10);
        done();
    });

    tarIterator.read();
});
