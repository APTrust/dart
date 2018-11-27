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
var download = require("download");
var util_1 = require("../util");
function fetchNodeSourceAsync(dest, url, step, options) {
    if (options === void 0) { options = {}; }
    var setText = function (p) { return step.modify("Downloading Node: " + p.toFixed() + "%..."); };
    return download(url, dest, Object.assign(options, { extract: true, strip: 1 }))
        .on('response', function (res) {
        var total = +res.headers['content-length'];
        var current = 0;
        res.on('data', function (data) {
            current += data.length;
            setText(current / total * 100);
            if (current === total) {
                step.log('Extracting Node...');
            }
        });
    })
        .then(function () { return step.log("Node source extracted to: " + dest); });
}
/**
 * Downloads the node source to the configured temporary directory
 * @param {*} compiler
 * @param {*} next
 */
function downloadNode(compiler, next) {
    return __awaiter(this, void 0, void 0, function () {
        var src, log, version, _a, sourceUrl, downloadOptions, url, step;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    src = compiler.src, log = compiler.log, version = compiler.targets[0].version;
                    _a = compiler.options, sourceUrl = _a.sourceUrl, downloadOptions = _a.downloadOptions;
                    url = sourceUrl || "https://nodejs.org/dist/v" + version + "/node-v" + version + ".tar.gz";
                    step = log.step("Downloading Node.js source from: " + url);
                    return [4 /*yield*/, util_1.pathExistsAsync(src)];
                case 1:
                    if (_b.sent()) {
                        step.log('Source already downloaded');
                        return [2 /*return*/, next()];
                    }
                    if (!compiler.options.build) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetchNodeSourceAsync(src, url, step, downloadOptions)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3: return [2 /*return*/, next()];
            }
        });
    });
}
exports.default = downloadNode;
