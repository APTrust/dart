const fs = require('fs');
const path = require('path');

// This callback setup is awkward. It should be more straightforward,
// simple, and clear.

// TODO: Replace this with Util.walkSync

class QuickStat {
    constructor(shouldInclude, fileCallback, dirCallback) {
        this.shouldInclude = shouldInclude;
        this.fileCallback = fileCallback;
        this.dirCallback = dirCallback;
    }

    statPath(err, stats, filepath) {
        if (err != null) {
            console.log(err)
            return
        }
        if (this.shouldInclude(filepath) == false) {
            return;
        }
        if (stats.isFile()) {
            this.fileCallback(stats);
        } else if (stats.isDirectory()) {
            this.recurseIntoDir(filepath)
        } else {
            // Symlinks, sockets, etc.
            //console.log("Other -> " + filepath)
        }
    }

    recurseIntoDir(filepath) {
        this.dirCallback();
        var quickStat = this;
        fs.readdir(filepath, function(err, files) {
            if (err != null) {
                console.log(err)
                return
            }
            files.forEach(function (file) {
                var fullpath = path.join(filepath, file)
                fs.stat(fullpath, function(err, stats) {
                    quickStat.statPath(err, stats, fullpath)
                });
            });
        });
    }
}

module.exports.QuickStat = QuickStat;
