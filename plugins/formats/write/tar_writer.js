const async = require('async');
const EventEmitter = require('events');
const path = require('path');
const { Plugin } = require('../../plugin');

module.exports = class TarWriter extends Plugin {
    constructor(pathToTarFile) {
        super();
        this.pathToTarFile = pathToTarFile;
        this.bagName = path.basename(pathToTarFile, '.tar');
        this._tarPacker = null;
        this._tarOutputWriter = null;
        this._queue = async.queue(writeIntoArchive, 1);
        this._queue.drain = function () {
            this.emit('finish');
        }
    }

    static description() {
        return {
            id: '90110710-1ff9-4650-a086-d7b23772238f',
            name: 'TarWriter',
            description: 'Built-in DART tar writer. Writes files directory into a tarball.',
            version: '0.1',
            readsFormats: [],
            writesFormats: ['tar'],
            implementsProtocols: [],
            talksToRepository: [],
            setsUp: []
        };
    }

    add(bagItFile, cryptoHashes = []) {
        var bagger = this;
        var header = {
            // Don't use path.join because Windows will give us
            // backslashes and tar file needs forward slashes.
            name: this.bagName + '/' + bagItFile.relDestPath,
            size: bagItFile.stats.size,
            mode: bagItFile.stats.mode,
            uid: bagItFile.stats.uid,
            gid: bagItFile.stats.gid,
            mtime: bagItFile.stats.mtime
        };
        // pax headers allow us to include files over 8GB in size
        header.pax = {
            size: bagItFile.stats.size
        };

        var startFn = function() { bagger.emitter.emit('fileAddStart', `Adding file ${bagItFile.relDestPath}`); }
        var endFn = function() { bagger.emitter.emit('fileAddEnd', true, `Added file ${bagItFile.relDestPath}`); }
        var data = {
            absSourcePath: bagItFile.absSourcePath,
            header: header,
            tar: this._getTarPacker(),
            hashes: hashes,
            startFn: startFn,
            endFn: endFn
        };
        this._queue.push(data);
    }

    _getTarPacker() {
        if (this._tarPacker == null) {
            this._tarPacker = tar.pack();
            this._tarPacker.pipe(this.getTarOutputWriter());
        }
        return this._tarPacker;
    }

    _getTarOutputWriter() {
        if (this._tarOutputWriter == null) {
            if (!this.pathToTarFile.endsWith(".tar")) {
                throw `pathToTarFile '${this.pathToTarFile}' must have .tar extension`;
            }
            var options = {
                mode: 0o644,
                autoClose: false
            };
            this._tarOutputWriter = fs.createWriteStream(this.pathToTarFile, options);
        }
        return this._tarOutputWriter;
    }
}

function writeIntoArchive(data, done) {
    data.startFn();
    var reader = fs.createReadStream(data.absSourcePath);
    reader.on('end', data.endFn);
    var writer = data.tar.entry(data.header, done);
    reader.pause();
    for (var h of data.hashes) {
        reader.pipe(h)
    }
    reader.pipe(writer);
    reader.resume();
}
