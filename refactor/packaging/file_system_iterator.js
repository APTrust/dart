const fs = require('fs');
const EventEmitter = require('events');
const { PassThrough, Readable } = require('stream');
const readdirp = require('readdirp');

class FileSystemIterator extends EventEmitter {

    constructor(pathToDirectory) {
        super();
        this.pathToDirectory = pathToDirectory;
        this.fileCount = 0;
    }

    read() {
        var fsIterator = this;
        var stream = readdirp({ root: fsIterator.pathToDirectory });
        fsIterator.fileCount = 0;
        fsIterator.dirCount = 0;
        stream.on('warn', function(warning) {
            fsIterator.emit('warn', warning);
        });
        stream.on('error', function(error) {
            fsIterator.emit('err', error);
        });
        stream.on('end', function() {
            // finish mimics TarFileIterator
            fsIterator.emit('finish', fsIterator.fileCount);
        });
        stream.on('close', function() {
            fsIterator.emit('close');
        });
        stream.on('data', function(entry) {
            // Emit relPath, fs.Stat and readable stream to match what
            // TarIterator emits. Caller can get full path
            // by prepending FileSystemIterator.pathToDirectory
            // to entry.path, which is relative.
            //
            // Also note that we want to mimic the behavior of
            // TarFileIterator by returning only one open readable stream
            // at a time. This is why we pause the stream and don't
            // resume it until the caller is done reading the underlying
            // file.
            if (entry.stat.isFile()) {
                fsIterator.fileCount += 1;
                stream.pause();
                var readable = fs.createReadStream(entry.fullPath);
                readable.on('end', function() {
                    stream.resume();
                });
                readable.on('error', function() {
                    stream.resume();
                });
                readable.on('close', function() {
                    stream.resume();
                });
                fsIterator.emit('entry', entry.path, entry.stat, readable);
            } else {
                if (entry.stat.isDirectory()) {
                    fsIterator.dirCount += 1;
                }
                fsIterator.emit('entry', entry.path, entry.stat, new DummyReader);
            }
        });
    }

    list() {
        var fsIterator = this;
        var stream = readdirp({ root: fsIterator.pathToDirectory });
        fsIterator.fileCount = 0;
        fsIterator.DirCount = 0;
        stream.on('warn', function(warning) {
            fsIterator.emit('warn', warning);
        });
        stream.on('error', function(error) {
            fsIterator.emit('err', error);
        });
        stream.on('end', function() {
            // finish mimics TarFileIterator
            fsIterator.emit('finish', fsIterator.fileCount);
        });
        stream.on('close', function() {
            fsIterator.emit('close');
        });
        stream.on('data', function(entry) {
            // Emit relPath and fs.Stat object to match what
            // TarIterator emits. Caller can get full path
            // by prepending FileSystemIterator.pathToDirectory
            // to entry.path, which is relative.
            if (entry.stat.isFile()) {
                fsIterator.fileCount += 1;
            } else if (entry.stat.isDirectory()) {
                fsIterator.dirCount += 1;
            }
            fsIterator.emit('entry', entry.path, entry.stat);
        });
    }
}

class DummyReader extends Readable {
    constructor() {
        super();
    }
    _read() {
        this.emit('end');
        return null;
    }
}

module.exports.FileSystemIterator = FileSystemIterator;
