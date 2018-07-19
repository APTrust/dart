const path = require('path');
const fs = require('fs');
const os = require('os');
const Store = require('electron-store');
var db = new Store({name: 'internal'});

class Util {
    // Thanks https://gist.github.com/kaizhu256/4482069
    static uuid4() {
        var uuid = '', ii;
        for (ii = 0; ii < 32; ii += 1) {
            switch (ii) {
            case 8:
            case 20:
                uuid += '-';
                uuid += (Math.random() * 16 | 0).toString(16);
                break;
            case 12:
                uuid += '-';
                uuid += '4';
                break;
            case 16:
                uuid += '-';
                uuid += (Math.random() * 4 | 8).toString(16);
                break;
            default:
                uuid += (Math.random() * 16 | 0).toString(16);
            }
        }
        return uuid;
    }
    // returns the byte length of an utf8 string
    // Thanks https://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
    static unicodeByteLength(str) {
        var s = str.length;
        for (var i=str.length-1; i>=0; i--) {
            var code = str.charCodeAt(i);
            if (code > 0x7f && code <= 0x7ff) s++;
            else if (code > 0x7ff && code <= 0xffff) s+=2;
            if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
        }
        return s;
    }
    static looksLikeUUID(str) {
        var match = null
        try {
            var re = /^([a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}?)$/i;
            match = str.match(re);
        } catch (ex) {
            // null string or non-string
        }
        return match != null;
    }
    static sortByName(store) {
        return Util.sort(store, 'name', 'asc');
    }
    static sortByCreated(store) {
        return Util.sort(store, 'created', 'desc');
    }
    static sortByUpdated(store) {
        return Util.sort(store, 'updated', 'desc');
    }
    static sort(store, field, direction) {
        var list = [];
        for (var key in store) {
            list.push(store[key]);
        }
        if (direction == 'desc') {
            list.sort(function(a, b) {
                // descending sort
                if (a[field] < b[field]) { return 1; }
                if (a[field] > b[field]) { return -1; }
                return 0;
            });
        } else {
            list.sort(function(a, b) {
                // ascending sort
                if (a[field] < b[field]) { return -1; }
                if (a[field] > b[field]) { return 1; }
                return 0;
            });
        }
        return list;
    }
    static isEmpty(str) {
        return (str == null || ((typeof str) == "string" && str.trim() == ""));
    }
    static isEmptyArray(arr) {
        if(arr == null || arr.length == 0) {
            return true;
        }
        for(let str of arr) {
            if (!Util.isEmpty(str)) {
                return false;
            }
        }
        return true;
    }
    static filterEmpties(arr) {
        if(arr == null || !Array.isArray(arr)) {
            console.log(`filterEmpties: param arr is not an array. Value: ${arr}`)
            return [];
        }
        return arr.map(item => item.trim()).filter(item => item != "");
    }
    static listContains(list, item) {
        for (var i of list) {
            if (i == item || Util.boolEqual(i, item)) {
                return true;
            }
        }
        return false;
    }
    static boolEqual(a, b) {
        var aValue = Util.boolValue(a);
        var bValue = Util.boolValue(b);
        return (aValue != null && aValue == bValue);
    }
    static boolValue(str) {
        var lcString = String(str).toLowerCase();
        if (lcString == "true" || lcString == "yes") {
            return true;
        } else if (lcString == "false" || lcString == "no") {
            return false;
        }
        return null;
    }

    // toHumanSize returns a human-readable size for the given
    // number of bytes. The return value is trucated at two
    // decimal places.
    static toHumanSize(bytes) {
        if (isNaN(bytes)) {
            return 'Not a Number';
        }
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        var hs = bytes;
        for(var i=0; i < sizes.length; i++) {
            hs = bytes / (1024 ** i);
            if (hs < 1024) {
                break;
            }
        }
        return `${hs.toFixed(2)} ${sizes[i]}`;
    }

    // getInternalVar retrieves the app's internal variable with
    // the specified name. Internal vars are not visible to users.
    static getInternalVar(name) {
        var val = db.get(name);
        if (typeof val == 'undefined') {
            val = null;
        }
        return val;
    }

    // setInternalVar set the internal variable with
    // the specified name to the specified value. Internal vars are
    // not visible to users.
    static setInternalVar(name, value) {
        db.set(name, value);
    }

    static isDevMode() {
        return (process.execPath.includes('node_modules/electron') ||
                process.execPath.includes('node_modules\electron'));
    }

    static truncateString(str, len) {
        if (Util.isEmpty(str) || str.length <= len) {
            return str;
        }
        return str.slice(0, len - 1) + '...';
    }

	// converts an absolute Windows path to a relative path suitable
	// for a BagIt file or tar file.
	static windowsToRelPath(winPath) {
		// Remove C:
		winPath = winPath.replace(/^[A-Z]:/i, '');
		// Remove \\share
		winPath = winPath.replace(/^\\\\[^\\]+/, '');
		// Backslash to forward slash
		return winPath.replace(/\\/g, '/');
	}

    // walkSync recursively lists all files in a directory and its
    // subdirectories and returns them in filelist. If you want to
    // filter the list, include a callback filterFunction, which takes
    // the filepath as its sole param (a string) and returns true or
    // false to indicate whether to include the file in the list.
    //
    // The returned list is a list of hashes, and each hash has keys
    // absPath: the absolute path to the file
    // stats: a Node fs.Stats object with info about the file
    // The returned list will not include links, only files.
    static walkSync(dir, filelist, filterFunction) {
        var files = fs.readdirSync(dir);
        filelist = filelist || [];
        filterFunction = filterFunction || function(file) { return true };
        files.forEach(function(file) {
            var absPath = path.join(dir, file);
            if (!fs.existsSync(absPath)) {
                //console.log(`Does not exist: ${absPath}`);
                return;  // Symlinks give ENOENT error
            }
            var stats = fs.statSync(absPath);
            if (stats.isDirectory()) {
                filelist = Util.walkSync(absPath, filelist, filterFunction);
            }
            else if (stats.isFile() && filterFunction(absPath)) {
                filelist.push({
                    absPath: absPath,
                    stats: stats
                });
            }
        });
        return filelist;
    };
    // This should would both in Electron and in headless Node.js
    static getPackageInfo() {
        return require('../../package.json')
    }
    static dartVersion() {
        var pkg = Util.getPackageInfo();
        return `${pkg.name} ${pkg.version} (Electron ${pkg.build.electronVersion} for ${os.platform()})`
    }
}

module.exports.Util = Util;
