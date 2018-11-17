"use strict";
var fs = require('fs');
var fd = fs.openSync(process.execPath, 'r');
var stat = fs.statSync(process.execPath);
var footer = Buffer.from(Array(32));
fs.readSync(fd, footer, 0, 32, stat.size - 32);
if (!footer.slice(0, 16).equals(Buffer.from('<nexe~~sentinel>'))) {
    throw 'Invalid Nexe binary';
}
var contentSize = footer.readDoubleLE(16);
var resourceSize = footer.readDoubleLE(24);
var contentStart = stat.size - 32 - resourceSize - contentSize;
var resourceStart = contentStart + contentSize;
Object.defineProperty(process, '__nexe', (function () {
    var nexeHeader = null;
    return {
        get: function () {
            return nexeHeader;
        },
        set: function (value) {
            if (nexeHeader) {
                throw new Error('__nexe cannot be reconfigured');
            }
            nexeHeader = Object.assign({}, value, {
                layout: {
                    stat: stat,
                    contentSize: contentSize,
                    contentStart: contentStart,
                    resourceSize: resourceSize,
                    resourceStart: resourceStart
                }
            });
            Object.freeze(nexeHeader);
        },
        enumerable: false,
        configurable: false
    };
})());
var contentBuffer = Buffer.from(Array(contentSize));
fs.readSync(fd, contentBuffer, 0, contentSize, contentStart);
fs.closeSync(fd);
var Module = require('module');
process.mainModule = new Module(process.execPath, null);
process.mainModule.loaded = true;
process.mainModule._compile(contentBuffer.toString(), process.execPath);
