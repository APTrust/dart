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
var got = require("got");
var target_1 = require("./target");
function getJson(url, options) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, got(url, options)];
                case 1: return [2 /*return*/, _b.apply(_a, [(_c.sent()).body])];
            }
        });
    });
}
function isBuildableVersion(version) {
    var major = +version.split('.')[0];
    return !~[0, 1, 2, 3, 4, 5, 7].indexOf(major) || version === '4.8.4';
}
function getLatestGitRelease(options) {
    return getJson('https://api.github.com/repos/nexe/nexe/releases/latest', options);
}
exports.getLatestGitRelease = getLatestGitRelease;
function getUnBuiltReleases(options) {
    return __awaiter(this, void 0, void 0, function () {
        var nodeReleases, existingVersions, versionMap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getJson('https://nodejs.org/download/release/index.json')];
                case 1:
                    nodeReleases = _a.sent();
                    return [4 /*yield*/, getLatestGitRelease(options)];
                case 2:
                    existingVersions = (_a.sent()).assets.map(function (x) { return target_1.getTarget(x.name); });
                    versionMap = {};
                    return [2 /*return*/, nodeReleases
                            .reduce(function (versions, _a) {
                            var version = _a.version;
                            version = version.replace('v', '').trim();
                            if (!isBuildableVersion(version) || versionMap[version]) {
                                return versions;
                            }
                            versionMap[version] = true;
                            target_1.platforms.forEach(function (platform) {
                                target_1.architectures.forEach(function (arch) {
                                    if (arch === 'x86' && platform === 'mac')
                                        return;
                                    versions.push(target_1.getTarget({ platform: platform, arch: arch, version: version }));
                                });
                            });
                            return versions;
                        }, [])
                            .filter(function (x) { return !existingVersions.some(function (t) { return target_1.targetsEqual(t, x); }); })];
            }
        });
    });
}
exports.getUnBuiltReleases = getUnBuiltReleases;
