const electron = require('electron');
const app = (process.type === 'renderer') ? electron.remote.app : electron.app;
const fs = require('fs');
const log = require('electron-log/main'); // requiring 'electron-log' leaves transport undefined
const path = require('path');
const { Util } = require('./util');
const zlib = require('zlib');


const megabyte = 1048576;

log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
log.transports.console.format = "{text}";
log.transports.file.maxSize = 4 * megabyte;

if (Util.isDevMode()) {
    log.transports.file.level = 'debug';
    log.transports.console.level = false;
} else {
    log.transports.file.level = 'info';
    log.transports.console.level = false;
}

log.filename = function() {
    return log.transports.file.findLogPath();
}

log.zip = function() {
    var gzip = zlib.createGzip();
    var infile = fs.createReadStream(log.filename());
    var timestamp = new Date().getTime();
    var outpath = path.join(app.getPath('desktop'), `EasyStoreLog_${timestamp}.txt.gz`);
    var outfile = fs.createWriteStream(outpath);
    infile.pipe(gzip).pipe(outfile);
}

// Use log.info("message")
//     log.warn("message")
//     log.error("message")
//     log.debug("message")

module.exports = log;
