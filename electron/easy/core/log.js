const log = require('electron-log/main');
const { Util } = require('./util');

const megabyte = 1048576;

log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
log.transports.console.format = "{text}";
log.transports.file.maxSize = 4 * megabyte;

if (Util.isDevMode()) {
    log.transports.file.level = 'debug';
    log.transports.console.level = 'debug';
} else {
    log.transports.file.level = 'warn';
    log.transports.console.level = false;
}

log.filename = function() {
    return log.transports.file.findLogPath();
}

module.exports = log;
