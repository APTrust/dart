"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var child_process_1 = require("child_process");
var pify = require("pify");
var rimraf = require("rimraf");
var rimrafAsync = pify(rimraf);
exports.rimrafAsync = rimrafAsync;
function each(list, action) {
    return __awaiter(this, void 0, void 0, function () {
        var l, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, list];
                case 1:
                    l = _a.sent();
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < l.length)) return [3 /*break*/, 5];
                    return [4 /*yield*/, action(l[i], i, l)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.each = each;
function falseOnEnoent(e) {
    if (e.code === 'ENOENT') {
        return false;
    }
    throw e;
}
function padRight(str, l) {
    return (str + ' '.repeat(l)).substr(0, l);
}
exports.padRight = padRight;
var bound = function bound(target, propertyKey, descriptor) {
    var configurable = true;
    return {
        configurable: configurable,
        get: function () {
            var value = descriptor.value.bind(this);
            Object.defineProperty(this, propertyKey, { configurable: configurable, value: value, writable: true });
            return value;
        }
    };
};
exports.bound = bound;
function dequote(input) {
    input = input.trim();
    var singleQuote = input.startsWith("'") && input.endsWith("'");
    var doubleQuote = input.startsWith('"') && input.endsWith('"');
    if (singleQuote || doubleQuote) {
        return input.slice(1).slice(0, -1);
    }
    return input;
}
exports.dequote = dequote;
var readFileAsync = pify(fs_1.readFile);
exports.readFileAsync = readFileAsync;
var writeFileAsync = pify(fs_1.writeFile);
exports.writeFileAsync = writeFileAsync;
var statAsync = pify(fs_1.stat);
exports.statAsync = statAsync;
var execFileAsync = pify(child_process_1.execFile);
exports.execFileAsync = execFileAsync;
var isWindows = process.platform === 'win32';
exports.isWindows = isWindows;
function pathExistsAsync(path) {
    return statAsync(path)
        .then(function (x) { return true; })
        .catch(falseOnEnoent);
}
exports.pathExistsAsync = pathExistsAsync;
function isDirectoryAsync(path) {
    return statAsync(path)
        .then(function (x) { return x.isDirectory(); })
        .catch(falseOnEnoent);
}
exports.isDirectoryAsync = isDirectoryAsync;
