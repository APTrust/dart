const fs = require('fs');
const EventEmitter = require('events');
const tar = require('tar-stream');
const { FileStat } = require('../util/file/filestat');

class TarIterator extends EventEmitter {

    constructor(pathToTarFile) {
        super();
        this.pathToTarFile = pathToTarFile;
        this.fileCount = 0;
    }

    read() {
        var tarIterator = this;
        var extract = tar.extract();
        extract.on('entry', function(header, stream, next) {
            // Note that header.type can be any of the following:
            // file | link | symlink | directory | block-device
            // character-device | fifo | contiguous-file
            var fileStat = new FileStat({
                size: header.size,
                mode: header.mode,
                uid: header.uid,
                gid: header.gid,
                mtimeMs: header.mtime,
                isTypeFile: header.type == 'file',
                isTypeDir: header.type == 'directory'
            });

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
}

module.exports.TarIterator = TarIterator;
