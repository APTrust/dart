const path = require('path');
const { PassThrough } = require('stream');
const TarReader = require('./tar_reader');

test('TarReader.read() emits expected events', done => {
    var streamCount = 0;
    var finishCount = 0;
    var pathToTarFile = path.join(__dirname, "..", "..", "..", "test", "bags", "aptrust", "example.edu.sample_good.tar")
    var tarReader = new TarReader(pathToTarFile);

    // Count the number of stream events.
    tarReader.on('entry', function(entry) {
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
    tarReader.on('end', function(fileCount) {
        finishCount = fileCount;
        expect(streamCount).toEqual(10);
        expect(finishCount).toEqual(10);
        done();
    });

    tarReader.read();
});

var expectedStats = {
    "example.edu.sample_good/":{
        "size":0,
        "mode":493,
        "uid":502,
        "gid":20,
        "mtimeMs":"2018-11-07T21:02:25.000Z",
        "type":"directory"
    },
    "example.edu.sample_good/aptrust-info.txt":{
        "size":74,
        "mode":420,
        "uid":502,
        "gid":20,
        "mtimeMs":"2018-11-07T21:02:21.000Z",
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
        "size":0,
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

/* --------------------------------------------------------------

Items in this tar file:

     0  example.edu.sample_good/
    74  example.edu.sample_good/aptrust-info.txt
   223  example.edu.sample_good/bag-info.txt
    55  example.edu.sample_good/bagit.txt
     0  example.edu.sample_good/data/
   230  example.edu.sample_good/manifest-md5.txt
  2388  example.edu.sample_good/data/datastream-DC
  6191  example.edu.sample_good/data/datastream-descMetadata
  4663  example.edu.sample_good/data/datastream-MARC
   579  example.edu.sample_good/data/datastream-RELS-EXT

 14403  TOTAL

----------------------------------------------------------------*/

test('TarReader.read() returns correct stats', done => {
    var pathToTarFile = path.join(__dirname, "..", "..", "..", "test", "bags", "aptrust", "example.edu.sample_good.tar")
    var tarReader = new TarReader(pathToTarFile);

    // Count the number of stream events.
    tarReader.on('entry', function(entry) {
        var expected = expectedStats[entry.relPath];
        expect(expected).not.toBeNull();
        expect(entry.fileStat.size).toEqual(expected.size);
        expect(entry.fileStat.mode).toEqual(expected.mode);
        expect(entry.fileStat.uid).toEqual(expected.uid);
        expect(entry.fileStat.gid).toEqual(expected.gid);
        expect(entry.fileStat.mtimeMs.toISOString()).toEqual(expected.mtimeMs);
        expect(entry.fileStat.type).toEqual(expected.type);
        entry.stream.pipe(new PassThrough());
    });

    // Let jest know when we're done.
    tarReader.on('end', function(fileCount) {
        expect(tarReader.fileCount).toEqual(8);
        expect(tarReader.byteCount).toEqual(14403);
        expect(tarReader.dirCount).toEqual(2);
        done();
    });

    tarReader.read();
});

test('TarReader.list() returns correct stats', done => {
    var pathToTarFile = path.join(__dirname, "..", "..", "..", "test", "bags", "aptrust", "example.edu.sample_good.tar")
    var tarReader = new TarReader(pathToTarFile);

    // Count the number of stream events.
    // Note that list does not return the stream, only stats.
    tarReader.on('entry', function(entry) {
        var expected = expectedStats[entry.relPath];
        expect(expected).not.toBeNull();
        expect(entry.fileStat.size).toEqual(expected.size);
        expect(entry.fileStat.mode).toEqual(expected.mode);
        expect(entry.fileStat.uid).toEqual(expected.uid);
        expect(entry.fileStat.gid).toEqual(expected.gid);
        expect(entry.fileStat.mtimeMs.toISOString()).toEqual(expected.mtimeMs);
        expect(entry.fileStat.type).toEqual(expected.type);
    });

    // Let jest know when we're done.
    tarReader.on('end', function(fileCount) {
        expect(tarReader.fileCount).toEqual(8);
        expect(tarReader.byteCount).toEqual(14403);
        expect(tarReader.dirCount).toEqual(2);
        done();
    });

    tarReader.list();
});
