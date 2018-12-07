const path = require('path');
const fs = require('fs');
const os = require('os');
/**
 * Util contains a number of static utility functions used throughout
 * the DART application. It has no constructor. Simply call Util.<method>(<args>)
 * to use any of its methods.
 *
 */

class Util {

    /**
      * Returns a version 4 uuid string.
      *
      * Thanks https://gist.github.com/kaizhu256/4482069
      * @returns {string }
      */
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

    /**
      * Returns the byte length of an utf8 string
      *
      * @param {string} str - The string to measure.
      * @returns {number}
      */
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

    /**
      * Returns true if str matches the regex for hex-formatted uuid.
      *
      * @param {string} str - The string to measure.
      * @returns {boolean}
      */
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


    /**
      * Returns true if str is null or empty.
      *
      * @param {string} str - The string to check.
      * @returns {boolean}
      */
    static isEmpty(str) {
        return (str == null || ((typeof str) == "string" && str.trim() == ""));
    }

    /**
      * Returns true if array of strings is empty, or if all elements
      * of the array are null or empty.
      *
      * @param {string[]} arr - The list of strings to check.
      * @returns {boolean}
      */
    static isEmptyStringArray(arr) {
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

    /**
      * Returns an array of strings, with all null and empty strings
      * removed.
      *
      * @param {string[]} arr - The list of strings to filter.
      * @returns {string[]} - The list of strings, minus null and empty entries.
      */
    static filterEmptyStrings(arr) {
        if(arr == null || !Array.isArray(arr)) {
            //console.log(`filterEmpties: param arr is not an array. Value: ${arr}`)
            return [];
        }
        return arr.map(item => item? item.trim() : "").filter(item => item != "");
    }

    /**
      * Returns true if list contains item. The list should contain simple
      * scalar values that can be compared with a simple equality test.
      * This is similar to the builtin array.includes(), but includes some
      * special handling for boolean values.
      *
      * @param {string[]|number[]|boolean[]} list - The list items to search.
      * @param {string|number|boolean} item - The item to look for.
      * @returns {boolean} True if the item is in the list.
      */
    static listContains(list, item) {
        for (var i of list) {
            if (i == item || Util.boolEqual(i, item)) {
                return true;
            }
        }
        return false;
    }

    /**
      * Returns a function suitable for sorting a list of objects
      * in ascending or desdending order.
      *
      * @param {string} property - The name of the object property to sort on.
      * @param {string} direction - 'desc' or 'asc' for descending or ascending.
      * @returns {function} A function with params (a, b) where a and b are items to be compared.
      */
    static getSortFunction(property, direction) {
        if (direction == 'desc') {
            return function(a, b) {
                // descending sort
                if (a[property] < b[property]) { return 1; }
                if (a[property] > b[property]) { return -1; }
                return 0;
            };
        } else {
            return function(a, b) {
                // ascending sort
                if (a[property] < b[property]) { return -1; }
                if (a[property] > b[property]) { return 1; }
                return 0;
            }
        }
    }

    /**
      * Returns true if a and b are both non-null and both indicate
      * the same truth value. E.g. true = "true" = "yes" and
      * false = "false" = "no".
      *
      * @param {boolean|string} a - First value to compare.
      * @param {boolean|string} b - Second value to compare.
      * @returns {boolean} True if the two values indicate the same boolean value.
      */
    static boolEqual(a, b) {
        var aValue = Util.boolValue(a);
        var bValue = Util.boolValue(b);
        return (aValue != null && aValue == bValue);
    }

    /**
      * Returns the boolean value of a string. "true" and "yes"
      * are true. "false" and "no" are false. String is case-insensitive.
      *
      * @param {boolean|string} str - The string to examine.
      * @returns {boolean} The boolean value of the string, or null if it can't be determined.
      */
    static boolValue(str) {
        var lcString = String(str).toLowerCase();
        if (lcString == "true" || lcString == "yes") {
            return true;
        } else if (lcString == "false" || lcString == "no") {
            return false;
        }
        return null;
    }

    /**
     * toHumanSize returns a human-readable size for the given
     * number of bytes. The return value is trucated at two
     * decimal places. E.g. 2621440 converts to "2.50 MB"
     *
     * @param {number} bytes - The number of bytes to convert to human size.
     * @returns {string} - A human-readable string, like "2.5 MB"
     */
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

    /**
      * Truncates a string at len characters, and appends '..." to the end.
      *
      * @param {string} str - The string to truncate.
      * @param {number} len - Truncate the string at len characters.
      * @returns {string} - The truncated string, with three trailing dots.
      */
    static truncateString(str, len) {
        if (Util.isEmpty(str) || str.length <= len) {
            return str;
        }
        return str.slice(0, len - 1) + '...';
    }

    /**
	  * Converts an absolute Windows path to a path with forward slashes suitable
	  * for a BagIt file or tar file. Also strips off drive letters and share names.
      *
      * @param {string} winPath - An absolute Windows path.
      * @returns {string} - Path with drive and share removed, and slashes leaning the right way.
      *
    */
	static normalizeWindowsPath(winPath) {
		// Remove C:
		winPath = winPath.replace(/^[A-Z]:/i, '');
		// Remove \\share
		winPath = winPath.replace(/^\\\\[^\\]+/, '');
		// Backslash to forward slash
		return winPath.replace(/\\/g, '/');
	}

    /**
     * walkSync recursively lists all files in a directory and its
     * subdirectories and returns them in filelist. If you want to
     * filter the list, include a callback filterFunction, which takes
     * the filepath as its sole param (a string) and returns true or
     * false to indicate whether to include the file in the list.
     *
     * The returned list is a list of hashes, and each hash has keys
     * absPath: the absolute path to the file
     * stats: a Node fs.Stats object with info about the file
     * The returned list will not include links, only files.
     *
     * @param {string} dir - Path to directory.
     * @param {filterFunction} filterFunction - A function to filter out items that should not go into filelist.
     * @returns {string[]} A list of file paths under dir that pass the filter.
    */
    static walkSync(dir, filterFunction) {
        var files = fs.readdirSync(dir);
        var filelist = [];
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

    /**
     * Recursively deletes a directory and all its contents.
     * This will throw an exception if you try to delete any path that's
     * too close to the root of the file system (fewer than 8 characters
     * or fewer than 3 slashes/backslashes).
     *
     * @param {string} dir - Path to the directory you want to delete.
    */
    static deleteRecursive(filepath) {
        if (filepath.length < 8 || filepath.split(path.sep).length < 3) {
            throw `${filepath} does not look safe to delete`;
        }
        if (fs.existsSync(filepath)) {
            fs.readdirSync(filepath).forEach(function(file, index){
                var curPath = path.join(filepath, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    Util.deleteRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(filepath);
        }
    };
}

module.exports.Util = Util;
