"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const fsExtra = require("fs-extra");
const realm_utils_1 = require("realm-utils");
const Config_1 = require("./Config");
const LegoAPI = require("lego-api");
const Log_1 = require("./Log");
const userFuseDir = Config_1.Config.PROJECT_ROOT;
const stylesheetExtensions = new Set([".css", ".sass", ".scss", ".styl", ".less", ".pcss"]);
const MBLACKLIST = ["freelist", "sys"];
exports.Concat = require("fuse-concat-with-sourcemaps");
function contains(array, obj) {
    return array && array.indexOf(obj) > -1;
}
exports.contains = contains;
function replaceAliasRequireStatement(requireStatement, aliasName, aliasReplacement) {
    requireStatement = requireStatement.replace(aliasName, aliasReplacement);
    requireStatement = path.normalize(requireStatement);
    return requireStatement;
}
exports.replaceAliasRequireStatement = replaceAliasRequireStatement;
function jsCommentTemplate(fname, conditions, variables, raw, replaceRaw) {
    const contents = fs.readFileSync(fname).toString();
    let data = LegoAPI.parse(contents).render(conditions);
    for (let varName in variables) {
        data = data.replace(`$${varName}$`, JSON.stringify(variables[varName]));
    }
    if (replaceRaw) {
        for (let varName in replaceRaw) {
            data = data.split(varName).join(replaceRaw[varName]);
        }
    }
    for (let varName in raw) {
        data = data.replace(`$${varName}$`, raw[varName]);
    }
    return data;
}
exports.jsCommentTemplate = jsCommentTemplate;
function getFuseBoxInfo() {
    return require(path.join(Config_1.Config.FUSEBOX_ROOT, "package.json"));
}
exports.getFuseBoxInfo = getFuseBoxInfo;
let VERSION_PRINTED = false;
function printCurrentVersion() {
    if (!VERSION_PRINTED) {
        VERSION_PRINTED = true;
        const info = getFuseBoxInfo();
        Log_1.Log.defer(log => log.echoYellow(`--- FuseBox ${info.version} ---`));
    }
}
exports.printCurrentVersion = printCurrentVersion;
function getDateTime() {
    const data = new Date();
    let hours = data.getHours();
    let minutes = data.getMinutes();
    let seconds = data.getSeconds();
    hours = hours < 10 ? `0${hours}` : hours;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    seconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${hours}:${minutes}:${seconds}`;
}
exports.getDateTime = getDateTime;
function uglify(contents, { es6 = false, ...opts } = {}) {
    const UglifyJs = es6 ? require("uglify-es") : require("uglify-js");
    return UglifyJs.minify(contents.toString(), opts);
}
exports.uglify = uglify;
function readFuseBoxModule(target) {
    return fs.readFileSync(path.join(Config_1.Config.FUSEBOX_MODULES, target)).toString();
}
exports.readFuseBoxModule = readFuseBoxModule;
function write(fileName, contents) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, contents, e => {
            if (e) {
                return reject(e);
            }
            return resolve();
        });
    });
}
exports.write = write;
function camelCase(str) {
    let DEFAULT_REGEX = /[-_]+(.)?/g;
    function toUpper(match, group1) {
        return group1 ? group1.toUpperCase() : "";
    }
    return str.replace(DEFAULT_REGEX, toUpper);
}
exports.camelCase = camelCase;
function parseQuery(qstr) {
    let query = new Map();
    let a = qstr.split("&");
    for (let i = 0; i < a.length; i++) {
        let b = a[i].split("=");
        query.set(decodeURIComponent(b[0]), decodeURIComponent(b[1] || ""));
    }
    return query;
}
exports.parseQuery = parseQuery;
function ensureUserPath(userPath) {
    if (!path.isAbsolute(userPath)) {
        userPath = path.join(userFuseDir, userPath);
    }
    userPath = path.normalize(userPath);
    let dir = path.dirname(userPath);
    fsExtra.ensureDirSync(dir);
    return userPath;
}
exports.ensureUserPath = ensureUserPath;
function ensureAbsolutePath(userPath) {
    if (!path.isAbsolute(userPath)) {
        return path.join(userFuseDir, userPath);
    }
    return userPath;
}
exports.ensureAbsolutePath = ensureAbsolutePath;
function joinFuseBoxPath(...any) {
    return ensureFuseBoxPath(path.join(...any));
}
exports.joinFuseBoxPath = joinFuseBoxPath;
function ensureDir(userPath) {
    if (!path.isAbsolute(userPath)) {
        userPath = path.join(userFuseDir, userPath);
    }
    userPath = path.normalize(userPath);
    fsExtra.ensureDirSync(userPath);
    return userPath;
}
exports.ensureDir = ensureDir;
function isStylesheetExtension(str) {
    let ext = path.extname(str);
    return stylesheetExtensions.has(ext);
}
exports.isStylesheetExtension = isStylesheetExtension;
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
exports.escapeRegExp = escapeRegExp;
function string2RegExp(obj) {
    let escapedRegEx = obj
        .replace(/\*/g, "@")
        .replace(/[.?*+[\]-]/g, "\\$&")
        .replace(/@@/g, ".*", "i")
        .replace(/@/g, "\\w{1,}", "i");
    if (escapedRegEx.indexOf("$") === -1) {
        escapedRegEx += "$";
    }
    return new RegExp(escapedRegEx);
}
exports.string2RegExp = string2RegExp;
function removeFolder(userPath) {
    fsExtra.removeSync(userPath);
}
exports.removeFolder = removeFolder;
function replaceExt(npath, ext) {
    if (typeof npath !== "string") {
        return npath;
    }
    if (npath.length === 0) {
        return npath;
    }
    if (/\.[a-z0-9]+$/i.test(npath)) {
        return npath.replace(/\.[a-z0-9]+$/i, ext);
    }
    else {
        return npath + ext;
    }
}
exports.replaceExt = replaceExt;
function isGlob(str) {
    if (!str) {
        return false;
    }
    return /\*/.test(str);
}
exports.isGlob = isGlob;
function hashString(text) {
    var hash = 5381, index = text.length;
    while (index) {
        hash = (hash * 33) ^ text.charCodeAt(--index);
    }
    let data = hash >>> 0;
    return data.toString(16);
}
exports.hashString = hashString;
function isClass(obj) {
    const isCtorClass = obj.constructor && obj.constructor.toString().substring(0, 5) === "class";
    if (obj.prototype === undefined) {
        return isCtorClass;
    }
    const isPrototypeCtorClass = obj.prototype.constructor &&
        obj.prototype.constructor.toString &&
        obj.prototype.constructor.toString().substring(0, 5) === "class";
    return isCtorClass || isPrototypeCtorClass;
}
exports.isClass = isClass;
function fastHash(text) {
    let hash = 0;
    if (text.length == 0)
        return hash;
    for (let i = 0; i < text.length; i++) {
        let char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    let result = hash.toString(16).toString();
    if (result.charAt(0) === "-") {
        result = result.replace(/-/, "0");
    }
    return result;
}
exports.fastHash = fastHash;
function extractExtension(str) {
    const result = str.match(/\.([a-z0-9]+)\$?$/);
    if (!result) {
        throw new Error(`Can't extract extension from string ${str}`);
    }
    return result[1];
}
exports.extractExtension = extractExtension;
function ensureFuseBoxPath(input) {
    return input.replace(/\\/g, "/").replace(/\/$/, "");
}
exports.ensureFuseBoxPath = ensureFuseBoxPath;
function ensureCorrectBundlePath(input) {
    input = ensureFuseBoxPath(input);
    input = ensurePublicExtension(input);
    return input;
}
exports.ensureCorrectBundlePath = ensureCorrectBundlePath;
function transpileToEs5(contents) {
    const ts = require("typescript");
    let tsconfg = {
        compilerOptions: {
            module: "commonjs",
            target: "es5",
        },
    };
    let result = ts.transpileModule(contents, tsconfg);
    return result.outputText;
}
exports.transpileToEs5 = transpileToEs5;
function ensurePublicExtension(url) {
    let ext = path.extname(url);
    if (ext === ".ts") {
        url = replaceExt(url, ".js");
    }
    if (ext === ".tsx") {
        url = replaceExt(url, ".jsx");
    }
    return url;
}
exports.ensurePublicExtension = ensurePublicExtension;
function getBuiltInNodeModules() {
    const process = global.process;
    return Object.keys(process.binding("natives")).filter(m => {
        return !/^_|^internal|\//.test(m) && MBLACKLIST.indexOf(m) === -1;
    });
}
exports.getBuiltInNodeModules = getBuiltInNodeModules;
function findFileBackwards(target, limitPath) {
    let [found, reachedLimit] = [false, false];
    let filename = path.basename(target);
    let current = path.dirname(target);
    let iterations = 0;
    const maxIterations = 10;
    while (found === false && reachedLimit === false) {
        let targetFilePath = path.join(current, filename);
        if (fs.existsSync(targetFilePath)) {
            return targetFilePath;
        }
        if (limitPath === current) {
            reachedLimit = true;
        }
        current = path.join(current, "..");
        iterations++;
        if (iterations > maxIterations) {
            reachedLimit = true;
        }
    }
}
exports.findFileBackwards = findFileBackwards;
function walk(dir, options) {
    var defaults = {
        recursive: false,
    };
    options = Object.assign(defaults, options);
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + "/" + file;
        var stat = fs.statSync(file);
        if (options.recursive) {
            if (stat && stat.isDirectory())
                results = results.concat(walk(file));
            else
                results.push(file);
        }
        else if (stat && stat.isFile()) {
            results.push(file);
        }
    });
    return results;
}
exports.walk = walk;
function filter(items, fn) {
    if (Array.isArray(items)) {
        return items.filter(fn);
    }
    if (realm_utils_1.utils.isPlainObject(items)) {
        let newObject = {};
        for (let key in items) {
            if (items.hasOwnProperty(key)) {
                if (fn(items[key], key)) {
                    newObject[key] = items[key];
                }
            }
        }
        return newObject;
    }
}
exports.filter = filter;
const readline = require("readline");
class Spinner {
    constructor(options) {
        this.text = "";
        this.title = "";
        this.chars = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
        this.stream = process.stdout;
        this.delay = 60;
        if (typeof options === "string") {
            options = { text: options };
        }
        else if (!options) {
            options = {};
        }
        if (options.text)
            this.text = options.text;
        if (options.onTick)
            this.onTick = options.onTick;
        if (options.stream)
            this.stream = options.stream;
        if (options.title)
            this.title = options.title;
        if (options.delay)
            this.delay = options.delay;
    }
    start() {
        let current = 0;
        this.id = setInterval(() => {
            let msg = this.chars[current] + " " + this.text;
            if (this.text.includes("%s")) {
                msg = this.text.replace("%s", this.chars[current]);
            }
            this.onTick(msg);
            current = ++current % this.chars.length;
        }, this.delay);
        return this;
    }
    stop(clear) {
        clearInterval(this.id);
        this.id = undefined;
        if (clear) {
            this.clearLine(this.stream);
        }
        return this;
    }
    isSpinning() {
        return this.id !== undefined;
    }
    onTick(msg) {
        this.clearLine(this.stream);
        this.stream.write(msg);
        return this;
    }
    clearLine(stream) {
        readline.clearLine(stream, 0);
        readline.cursorTo(stream, 0);
        return this;
    }
}
exports.Spinner = Spinner;
