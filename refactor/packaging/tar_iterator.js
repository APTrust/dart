const fs = require('fs');
const EventEmitter = require('events');
const { FileStat } = require('../util/file/filestat');
const { PassThrough } = require('stream');
const tar = require('tar-stream');

class TarIterator extends EventEmitter {

    constructor(pathToTarFile) {
        super();
        this.pathToTarFile = pathToTarFile;
        this.fileCount = 0;
    }

    read() {
        var tarIterator = this;
        var extract = tar.extract();
        tarIterator.fileCount = 0;
        extract.on('entry', function(header, stream, next) {

            var fileStat = tarIterator._headerToFileStat(header);

            // relPath is the relative path of the file within
            // the tar file.
            var relPath = header.name;

            // Send the stream and the file stats to whoever is listening.
            tarIterator.emit('entry', relPath, fileStat, stream);

            // When we reach the end of the read stream, tell the
            // tar-stream library to move on to the next entry.
            stream.on('end', function() {
                tarIterator.fileCount += 1;
                next() // ready for next entry
            });
        });

        // Pass errors up to the listener.
        extract.on('error', function(err) {
            tarIterator.emit('error', err);
        });

        // Tell the listener when we're done reading the entire
        // tar file.
        extract.on('finish', function() {
            tarIterator.emit('finish', tarIterator.fileCount);
        });

        // Open the tar file and start reading.
        fs.createReadStream(tarIterator.pathToTarFile).pipe(extract)
    }

    list() {
        var tarIterator = this;
        var extract = tar.extract();
        tarIterator.fileCount = 0;
        extract.on('entry', function(header, stream, next) {
            var fileStat = tarIterator._headerToFileStat(header);
            var relPath = header.name;
            tarIterator.emit('entry', relPath, fileStat);
            stream.on('end', function() {
                tarIterator.fileCount += 1;
                next();
            });
            stream.pipe(new PassThrough());
        });

        // Pass errors up to the listener.
        extract.on('error', function(err) {
            tarIterator.emit('error', err);
        });

        // Tell the listener when we're done reading the entire
        // tar file.
        extract.on('finish', function() {
            tarIterator.emit('finish', tarIterator.fileCount);
        });

        // Open the tar file and start reading.
        fs.createReadStream(tarIterator.pathToTarFile).pipe(extract)
    }

    _headerToFileStat(header) {
        return new FileStat({
            size: header.size,
            mode: header.mode,
            uid: header.uid,
            gid: header.gid,
            mtimeMs: header.mtime,
            type: header.type
        });
    }
}

module.exports.TarIterator = TarIterator;
