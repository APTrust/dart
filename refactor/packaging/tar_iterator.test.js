const path = require('path');
const { PassThrough } = require('stream');
const { TarIterator } = require('./tar_iterator');

test('TarIterator emits expected events', done => {
    var streamCount = 0;
    var finishCount = 0;
    var pathToTarFile = path.join(__dirname, "..", "test", "bags", "aptrust", "example.edu.sample_good.tar")
    var tarIterator = new TarIterator(pathToTarFile);

    // Count the number of stream events.
    tarIterator.on('entry', function(relPath, fileStat, stream) {
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
    tarIterator.on('finish', function(fileCount) {
        finishCount = fileCount;
        expect(streamCount).toEqual(10);
        expect(finishCount).toEqual(10);
        done();
    });

    tarIterator.read();
});

var expectedStats = {
    "example.edu.sample_good/":{
        "size":-1,
        "mode":493,
        "uid":502,
        "gid":20,
        "mtimeMs":"2014-12-12T20:54:13.000Z",
        "type":"directory"
    },
    "example.edu.sample_good/aptrust-info.txt":{
        "size":49,
        "mode":420,
        "uid":502,
        "gid":20,
        "mtimeMs":"2014-12-12T20:51:53.000Z",
        "type":"file"
    },
    "example.edu.sample_good/bag-info.txt":{
        "size":223,
        "mode":420,
        "uid":502,
        "gid":20,
        "mtimeMs":"2014-12-12T20:54:13.000Z",
        "type":"file"
    },
    "example.edu.sample_good/bagit.txt":{
        "size":55,
        "mode":420,
        "uid":502,
        "gid":20,
        "mtimeMs":"2014-12-12T20:51:53.000Z",
        "type":"file"
    },
    "example.edu.sample_good/data/":{
        "size":-1,
        "mode":493,
        "uid":502,
        "gid":20,
        "mtimeMs":"2014-11-25T16:28:25.000Z",
        "type":"directory"
    },
    "example.edu.sample_good/manifest-md5.txt":{
        "size":230,
        "mode":420,
        "uid":502,
        "gid":20,
        "mtimeMs":"2014-12-12T20:51:53.000Z",
        "type":"file"
    },
    "example.edu.sample_good/data/datastream-DC":{
        "size":2388,
        "mode":420,
        "uid":502,
        "gid":20,
        "mtimeMs":"2014-12-12T20:51:53.000Z",
        "type":"file"
    },
    "example.edu.sample_good/data/datastream-descMetadata":{
        "size":6191,
        "mode":420,
        "uid":502,
        "gid":20,
        "mtimeMs":"2014-12-12T20:51:53.000Z",
        "type":"file"
    },
    "example.edu.sample_good/data/datastream-MARC":{
        "size":4663,
        "mode":420,
        "uid":502,
        "gid":20,
        "mtimeMs":"2014-12-12T20:51:53.000Z",
        "type":"file"
    },
    "example.edu.sample_good/data/datastream-RELS-EXT":{
        "size":579,
        "mode":420,
        "uid":502,
        "gid":20,
        "mtimeMs":"2014-12-12T20:51:53.000Z",
        "type":"file"
    }
}

test('TarIterator returns correct stats', done => {
    var pathToTarFile = path.join(__dirname, "..", "test", "bags", "aptrust", "example.edu.sample_good.tar")
    var tarIterator = new TarIterator(pathToTarFile);

    // Count the number of stream events.
    tarIterator.on('entry', function(relPath, fileStat, stream) {
        var expected = expectedStats[relPath];
        expect(expected).not.toBeNull();
        expect(expected.size).toEqual(fileStat.size);
        expect(expected.mode).toEqual(fileStat.mode);
        expect(expected.uid).toEqual(fileStat.uid);
        expect(expected.gid).toEqual(fileStat.gid);
        expect(expected.mtimeMs).toEqual(fileStat.mtimeMs.toISOString());
        expect(expected.type).toEqual(fileStat.type);
        stream.pipe(new PassThrough());
    });

    // Let jest know when we're done.
    tarIterator.on('finish', function(fileCount) {
        done();
    });

    tarIterator.read();
});
