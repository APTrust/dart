"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = require("assert");
var binary = process.__nexe;
assert_1.ok(binary);
var manifest = binary.resources, directories = {}, isString = function (x) { return typeof x === 'string' || x instanceof String; }, isNotFile = function () { return false; }, isNotDirectory = isNotFile, isFile = function () { return true; }, noop = function () { }, isDirectory = isFile, fs = require('fs'), path = require('path'), originalExistsSync = fs.existsSync, originalReadFile = fs.readFile, originalReadFileSync = fs.readFileSync, originalCreateReadStream = fs.createReadStream, originalReaddir = fs.readdir, originalReaddirSync = fs.readdirSync, originalStatSync = fs.statSync, originalStat = fs.stat, originalRealpath = fs.realpath, originalRealpathSync = fs.realpathSync, resourceStart = binary.layout.resourceStart;
var getKey = process.platform.startsWith('win')
    ? function getKey(filepath) {
        var key = path.resolve(filepath);
        if (key.substr(1, 2) === ':\\') {
            key = key[0].toUpperCase() + key.substr(1);
        }
        return key;
    }
    : path.resolve;
var statTime = function () {
    var stat = binary.layout.stat;
    return {
        dev: 0,
        ino: 0,
        nlink: 0,
        rdev: 0,
        uid: 123,
        gid: 500,
        blksize: 4096,
        blocks: 0,
        atime: new Date(stat.atime),
        atimeMs: stat.atime.getTime(),
        mtime: new Date(stat.mtime),
        mtimeMs: stat.mtime.getTime(),
        ctime: new Date(stat.ctime),
        ctimMs: stat.ctime.getTime(),
        birthtime: new Date(stat.birthtime),
        birthtimeMs: stat.birthtime.getTime()
    };
};
var createStat = function (directoryExtensions, fileExtensions) {
    if (!fileExtensions) {
        return Object.assign({}, binary.layout.stat, directoryExtensions, { size: 0 }, statTime());
    }
    var size = directoryExtensions[1];
    return Object.assign({}, binary.layout.stat, fileExtensions, { size: size }, statTime());
};
var ownStat = function (filepath) {
    setupManifest();
    var key = getKey(filepath);
    if (directories[key]) {
        return createStat({ isDirectory: isDirectory, isFile: isNotFile });
    }
    if (manifest[key]) {
        return createStat(manifest[key], { isFile: isFile, isDirectory: isNotDirectory });
    }
};
function makeLong(filepath) {
    return path._makeLong && path._makeLong(filepath);
}
function fileOpts(options) {
    return !options ? {} : isString(options) ? { encoding: options } : options;
}
var setupManifest = function () {
    Object.keys(manifest).forEach(function (filepath) {
        var entry = manifest[filepath];
        var absolutePath = getKey(filepath);
        var longPath = makeLong(absolutePath);
        var normalizedPath = path.normalize(filepath);
        if (!manifest[absolutePath]) {
            manifest[absolutePath] = entry;
        }
        if (longPath && !manifest[longPath]) {
            manifest[longPath] = entry;
        }
        if (!manifest[normalizedPath]) {
            manifest[normalizedPath] = manifest[filepath];
        }
        var currentDir = path.dirname(absolutePath);
        var prevDir = absolutePath;
        while (currentDir !== prevDir) {
            directories[currentDir] = directories[currentDir] || {};
            directories[currentDir][path.basename(prevDir)] = true;
            var longDir = makeLong(currentDir);
            if (longDir && !directories[longDir]) {
                directories[longDir] = directories[currentDir];
            }
            prevDir = currentDir;
            currentDir = path.dirname(currentDir);
        }
    });
    setupManifest = noop;
};
//naive patches intended to work for most use cases
var nfs = {
    existsSync: function existsSync(filepath) {
        setupManifest();
        var key = getKey(filepath);
        if (manifest[key] || directories[key]) {
            return true;
        }
        return originalExistsSync.apply(fs, arguments);
    },
    realpath: function realpath(filepath, options, cb) {
        setupManifest();
        var key = getKey(filepath);
        if (isString(filepath) && (manifest[filepath] || manifest[key])) {
            return process.nextTick(function () { return cb(null, filepath); });
        }
        return originalRealpath.call(fs, filepath, options, cb);
    },
    realpathSync: function realpathSync(filepath, options) {
        setupManifest();
        var key = getKey(filepath);
        if (isString(filepath) && (manifest[filepath] || manifest[key])) {
            return filepath;
        }
        return originalRealpathSync.call(fs, filepath, options);
    },
    readdir: function readdir(filepath, options, callback) {
        setupManifest();
        filepath = filepath.toString();
        if ('function' === typeof options) {
            callback = options;
            options = { encoding: 'utf8' };
        }
        var dir = directories[getKey(filepath)];
        if (dir) {
            process.nextTick(function () {
                //todo merge with original?
                callback(null, Object.keys(dir));
            });
        }
        else {
            return originalReaddir.apply(fs, arguments);
        }
    },
    readdirSync: function readdirSync(filepath, options) {
        setupManifest();
        filepath = filepath.toString();
        var dir = directories[getKey(filepath)];
        if (dir) {
            return Object.keys(dir);
        }
        return originalReaddirSync.apply(fs, arguments);
    },
    readFile: function readFile(filepath, options, callback) {
        setupManifest();
        var entry = manifest[filepath] || manifest[getKey(filepath)];
        if (!entry || !isString(filepath)) {
            return originalReadFile.apply(fs, arguments);
        }
        var offset = entry[0], length = entry[1];
        var resourceOffset = resourceStart + offset;
        var encoding = fileOpts(options).encoding;
        callback = typeof options === 'function' ? options : callback;
        fs.open(process.execPath, 'r', function (err, fd) {
            if (err)
                return callback(err, null);
            fs.read(fd, Buffer.alloc(length), 0, length, resourceOffset, function (error, bytesRead, result) {
                if (error) {
                    return fs.close(fd, function () {
                        callback(error, null);
                    });
                }
                fs.close(fd, function (err) {
                    if (err) {
                        return callback(err, result);
                    }
                    callback(err, encoding ? result.toString(encoding) : result);
                });
            });
        });
    },
    createReadStream: function createReadStream(filepath, options) {
        setupManifest();
        var entry = manifest[filepath] || manifest[getKey(filepath)];
        if (!entry || !isString(filepath)) {
            return originalCreateReadStream.apply(fs, arguments);
        }
        var offset = entry[0], length = entry[1];
        var resourceOffset = resourceStart + offset;
        var opts = fileOpts(options);
        return fs.createReadStream(process.execPath, Object.assign({}, opts, {
            start: resourceOffset,
            end: resourceOffset + length - 1
        }));
    },
    readFileSync: function readFileSync(filepath, options) {
        setupManifest();
        var entry = manifest[filepath] || manifest[getKey(filepath)];
        if (!entry || !isString(filepath)) {
            return originalReadFileSync.apply(fs, arguments);
        }
        var offset = entry[0], length = entry[1];
        var resourceOffset = resourceStart + offset;
        var encoding = fileOpts(options).encoding;
        var fd = fs.openSync(process.execPath, 'r');
        var result = Buffer.alloc(length);
        fs.readSync(fd, result, 0, length, resourceOffset);
        fs.closeSync(fd);
        return encoding ? result.toString(encoding) : result;
    },
    statSync: function statSync(filepath) {
        var stat = isString(filepath) && ownStat(filepath);
        if (stat) {
            return stat;
        }
        return originalStatSync.apply(fs, arguments);
    },
    stat: function stat(filepath, callback) {
        var stat = isString(filepath) && ownStat(filepath);
        if (stat) {
            process.nextTick(function () {
                callback(null, stat);
            });
        }
        else {
            return originalStat.apply(fs, arguments);
        }
    }
};
if (typeof fs.exists === 'function') {
    nfs.exists = function (filepath, cb) {
        cb = cb || noop;
        var exists = nfs.existsSync(filepath);
        process.nextTick(function () { return cb(exists); });
    };
}
Object.assign(fs, nfs);
