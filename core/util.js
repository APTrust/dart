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
      * @param {string} str - The string to test.
      * @returns {boolean}
      */
    static looksLikeUUID(str) {
        var regex = /^([a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}?)$/i;
        return Util.stringMatchesRegex(str, regex);
    }

    /**
      * Returns true if str matches the regex for a URL beginning
      * with http or https.
      *
      * @param {string} str - The string to test.
      * @returns {boolean}
      */
    static looksLikeHypertextURL(str) {
        let regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
        return Util.stringMatchesRegex(str, regex);
    }

    static stringMatchesRegex(str, pattern) {
        var match = null
        try {
            match = str.match(pattern);
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
      * Converts a camel case variable name to title-cased text.
      * For example, myVarName is converted to My Var Name.
      * This is useful for converting var names to labels in the UI.
      *
      * @param {string} str - The string to convert
      * @returns {string}
      */
    static camelToTitle(str) {
        var spaced = str.replace( /([A-Z])/g, " $1" );
        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
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
      * @param {boolean|string} val - The value to examine.
      *
      * @returns {boolean} The boolean value of the string, or undefined
      * if it can't be determined.
      */
    static boolValue(val) {
        if (typeof val === 'boolean') {
            return val;
        }
        var lcString = String(val).toLowerCase();
        var trueValues = ['true', 'yes', '1'];
        var falseValues = ['false', 'no', '0'];
        var retValue;
        if (trueValues.includes(lcString)) {
            retValue = true;
        } else if (falseValues.includes(lcString)) {
            retValue = false;
        }
        return retValue;
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
     * Returns a copy of string str with the first letter set to
     * lowercase. Returns null if param str is null.
     *
     * @param {string}
     *
     * @returns {string}
     */
    static lcFirst(str) {
        if (!str) {
            return str;
        }
        return str.charAt(0).toLowerCase() + str.substr(1);
    }

    /**
     * Replaces backslashes in Windows paths with double backslashes.
     *
     * @param {string} winPath - A Windows path.
     *
     * @returns {string}
     */
    static escapeBackslashes(winPath) {
        return winPath.replace(/\\/g, '\\\\')
    }

    /**
	  * Converts an absolute Windows path to a path with forward slashes suitable
	  * for a BagIt file or tar file. Also strips off drive letters and share names.
      *
      * @param {string} winPath - An absolute Windows path.
      * @returns {string} - Path with drive and share removed, and slashes leaning
      * the right way.
      *
      */
	static normalizeWindowsPath(winPath) {
        winPath = Util.removeWindowsDrivePrefix(winPath);
		// Backslash to forward slash
		return winPath.replace(/\\/g, '/');
	}

    /**
	  * Strips off drive letters and share names from Windows paths.
      * E.g. "C:\some\path" becomes "\some\path" and "\\share\some\path"
      * becomes "\some\path"
      *
      * @param {string} winPath - An absolute Windows path.
      * @returns {string} - Path with drive and share removed.
      *
      */
    static removeWindowsDrivePrefix(winPath) {
		// Remove C:
		winPath = winPath.replace(/^[A-Z]:/i, '');
		// Remove \\share
		return winPath.replace(/^\\\\[^\\]+/, '');
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
     * Recursively and synchronously deletes a directory and all its contents.
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
            // Delete the directory that the code above just emptied out,
            // and ignore errors on Windows that come from synchronous
            // delete calls not actually deleting files when they say they do.
            // This problem is described in this bug report:
            //
            // https://github.com/nodejs/node-v0.x-archive/issues/3051
            //
            // On Windows, Node's unlinkSync function merely marks a file
            // to be deleted and then returns without deleting it, if the
            // file has an open read handle. This causes the rmdirSync call
            // below to throw an exception saying the directory isn't empty.
            //
            // Well screw that. When a synchronous function says it's done,
            // it should be done. The worst side-effect of ignoring Window's
            // stupidity in the catch block is that the user will end up
            // with some unneeded empty directories.
			try {
				fs.rmdirSync(filepath);
			} catch (err) {
				if (os.platform == 'win32') {
				    // Windows == Loserville
				} else {
					console.log(err);
				}
			}
        }
    };

    /**
     * This deletes up to one item from an array, modifying the
     * array in place. For example, Util.deleteFromArray(list, "butter")
     * will delete the first instance of the word "butter" from the
     * array, or will delete nothing if the array does not contain
     * that word.
     *
     * @param {Array} array - A list of items.
     *
     * @param {string|number|boolean|Date} item - The item you want to
     * delete.
     */
    static deleteFromArray(array, item) {
        let index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    /**
     * This function returns the basename of the given file path with
     * with the following extensions stripped off:
     *
     * * .7z, .s7z
     * * .bz, .bz2
     * * .gz
     * * .par, par2
     * * .rar
     * * .tar, .tar.gz, .tgz, .tar.Z
     * * .zip, .zipx
     *
     * The point is to return the expected name of the bag, based
     * on the file path. If the file's basename has an unrecognized
     * extension or no extension, this will return the basename unaltered.
     *
     * @param {string} filepath - Path to the bag.
    */
    static bagNameFromPath(filepath) {
        var bagName = path.basename(filepath);
        return bagName.replace(/\.tar$|\.tar\.gz$|\.t?gz$|\.tar\.Z$|\.tar\.bz$|\.tar\.bz2$|\.bz$|\.bz2$|\.zip$|\.zipx$|\.rar$|\.7z$|\.s7z$|\.par$|\.par2$/, '');
    }

    /**
     * This casts the string value str to type toType and returns
     * the cast value. This is used primarily for converting values
     * from HTML forms to correctly-typed JavaScript values.
     *
     * @example
     * Util.cast('false', 'boolean') // returns false
     * Util.cast('yes', 'boolean')   // returns true
     * Util.cast('1', 'boolean')     // returns true
     * Util.cast('3', 'number')      // returns 3
     * Util.cast('3.14', 'number')   // returns 3.14
     *
     * @param {string} str - The string value to be cast.
     *
     * @param {string} toType - The type to which the string value
     * should be cast. Currently supports only 'number' and 'boolean'.
    */
    static cast(str, toType) {
        let castValue = str;
        if (toType === 'boolean') {
            castValue = Util.boolValue(str);
        } else if (toType === 'number') {
            if (str.indexOf('.') > -1) {
                castValue = parseFloat(str);
            } else {
                castValue = parseInt(str);
            }
        }
        return castValue;
    }

    /**
     * This returns true if settingValue begins with "env:".
     *
     * @param {string} settingValue - The value of the setting.
     *
     * @returns {boolean}
     */
    static looksLikeEnvSetting(settingValue) {
        return settingValue.startsWith('env:');
    }

    /**
     * This returns the value of an environment variable, if
     * the variable is available. Certain variables, such as
     * the login credentials used in the {@link StorageService}
     * class may be stored more safely as environment variables
     * outside of the DART database. Those variables follow the
     * pattern env:VAR_NAME.
     *
     * If you pass env:VAR_NAME to this function, it will return
     * the value of the environment variable VAR_NAME.
     *
     * @param {string} str - A string in the format env:VAR_NAME.
     *
     * @returns {string}
     */
    static getEnvSetting(str) {
        let [prefix, varname] = str.split(':');
        return process.env[varname];
    }

    /**
     * Returns a path to a temp file, without actually creating
     * the file.
     *
     * @returns {string}
     *
     */
    static tmpFilePath() {
        let dartTmpDir = path.join(os.tmpdir(), 'DART');
        if (!fs.existsSync(dartTmpDir)) {
            fs.mkdirSync(dartTmpDir);
        }
        let prefix = Util.uuid4().split('-')[0];
        let suffix = Date.now().toString();
        let filename = `${prefix}_${suffix}`;
        return path.join(dartTmpDir, filename);
    }

    /**
     * Returns true if arrays a and b contain the same elements, regardless
     * of order. When specifying orderMatters = false, be careful using this
     * with large arrays, since it copies and sorts each array. This is
     * intended for arrays of scalar values like strings, numbers, and dates,
     * whose values can be compared for simple equality.
     *
     * @param {Array} a - The first array.
     * @param {Array} b - The second array.
     * @param {boolean} orderMatters - Set this to true if the arrays must
     * contain the same elements in the same order. Set to false to check if
     * they contain the same elements in any order.
     *
     * @returns {boolean}
     *
     */
    static arrayContentsMatch(a, b, orderMatters) {
        if (!Array.isArray(a) || !Array.isArray(b)) {
            return false;
        }
        if (a === b) {
            return true;
        }
        if (a.length != b.length) {
            return false;
        }
        let aCopy = orderMatters ? a : [...a].sort();
        let bCopy = orderMatters ? b : [...b].sort();
        for (var i = 0; i < aCopy.length; ++i) {
            if (aCopy[i] !== bCopy[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns true if the file at filepath is readable by
     * the current user/application.
     *
     * @params {string} filepath - The path the the file.
     * @returns {boolean}
     */
    static canRead(filepath) {
        let canRead = true;
        try {
            fs.accessSync(filepath, fs.constants.R_OK);
        } catch (err) {
            canRead = false;
        }
        return canRead;
    }

    /**
     * Returns true if the file at filepath is writable by
     * the current user/application.
     *
     * @params {string} filepath - The path the the file.
     * @returns {boolean}
     */
    static canWrite(filepath) {
        let canWrite = true;
        try {
            fs.accessSync(filepath, fs.constants.W_OK);
        } catch (err) {
            canWrite = false;
        }
        return canWrite;
    }

    /**
     * Given a list of file paths, this returns the prefix common
     * to all paths. This function probably has worse than 0n^2
     * efficiency, so it's OK if paths.length < 10, but it probably
     * gets pretty bad from there.
     *
     * If paths have nothing in common, this returns an empty string.
     *
     * @example
     * let posixPaths = [
     *     "/path/to/some/file.txt",
     *     "/path/to/some/other/document.pdf",
     *     "/path/to/some/different/photo.jpg"
     * ]
     *
     * Util.findCommonPathPrefix(posixPaths); // returns "/path/to/some/"
     *
     * let windowPaths = [
     *     "c:\\path\\to\\some\\file.txt",
     *     "c:\\path\\to\\some\\other\\file.txt",
     *     "c:\\path\\to\\some\\different\\file.txt",
     * ]
     *
     * Util.findCommonPathPrefix(windowsPaths); // returns "c:\\path\\to\\some\\"
     *
     * @param {Array<string>} paths - List of paths to compare.
     *
     * @param {string} pathSep - Optional param to specify the path
     * separator. This defaults to the operating system's path.sep, so you
     * don't need to specify this.
     *
     * @returns {string}
     */
    static findCommonPathPrefix(paths, pathSep = path.sep) {
        let i = 0;
        let lastPrefix = '';
        let prefix = '';
        let match = true;
        while(match) {
            i = paths[0].indexOf(pathSep, i + 1);
            if (i < 0) {
                break;
            }
            prefix = paths[0].slice(0, i + 1);
            for(let p of paths) {
                if (!p.startsWith(prefix)){
                    match = false;
                    prefix = lastPrefix; // this is the last one that did match
                    break;
                }
            }
            lastPrefix = prefix;
        }
        return prefix;
    }

}

module.exports.Util = Util;
