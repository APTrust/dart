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
var path_1 = require("path");
var fs_1 = require("fs");
var util_1 = require("../util");
var mkdirp = require("mkdirp");
var pify = require("pify");
var mkdirpAsync = pify(mkdirp);
var unlinkAsync = pify(fs_1.unlink);
var readdirAsync = pify(fs_1.readdir);
function readDirAsync(dir) {
    return readdirAsync(dir).then(function (paths) {
        return Promise.all(paths.map(function (file) {
            var path = path_1.join(dir, file);
            return util_1.isDirectoryAsync(path).then(function (x) { return (x ? readDirAsync(path) : path); });
        })).then(function (result) {
            return [].concat.apply([], result);
        });
    });
}
function maybeReadFileContentsAsync(file) {
    return util_1.readFileAsync(file, 'utf-8').catch(function (e) {
        if (e.code === 'ENOENT') {
            return '';
        }
        throw e;
    });
}
/**
 * The artifacts step is where source patches are committed, or written as "artifacts"
 * Steps:
 *  - A temporary directory is created in the downloaded source
 *  - On start, any files in that directory are restored into the source tree
 *  - After the patch functions have run, the temporary directory is emptied
 *  - Original versions of sources to be patched are written to the temporary directory
 *  - Finally, The patched files are written into source.
 *
 */
function artifacts(compiler, next) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        var src, temp, tmpFiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    src = compiler.src;
                    temp = path_1.join(src, 'nexe');
                    return [4 /*yield*/, mkdirpAsync(temp)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, readDirAsync(temp)];
                case 2:
                    tmpFiles = _a.sent();
                    return [4 /*yield*/, Promise.all(tmpFiles.map(function (path) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _b = (_a = compiler).writeFileAsync;
                                        _c = [path.replace(temp, '')];
                                        return [4 /*yield*/, util_1.readFileAsync(path, 'utf-8')];
                                    case 1: return [2 /*return*/, _b.apply(_a, _c.concat([_d.sent()]))];
                                }
                            });
                        }); }))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, next()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, Promise.all(tmpFiles.map(function (x) { return unlinkAsync(x); }))];
                case 5:
                    _a.sent();
                    return [2 /*return*/, Promise.all(compiler.files.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var sourceFile, tempFile, fileContents;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        sourceFile = path_1.join(src, file.filename);
                                        tempFile = path_1.join(temp, file.filename);
                                        return [4 /*yield*/, maybeReadFileContentsAsync(sourceFile)];
                                    case 1:
                                        fileContents = _a.sent();
                                        return [4 /*yield*/, mkdirpAsync(path_1.dirname(tempFile))];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, util_1.writeFileAsync(tempFile, fileContents)];
                                    case 3:
                                        _a.sent();
                                        return [4 /*yield*/, compiler.writeFileAsync(file.filename, file.contents)];
                                    case 4:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
            }
        });
    });
}
exports.default = artifacts;
