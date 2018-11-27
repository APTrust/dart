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
function getStdIn(stdin) {
    return new Promise(function (resolve) {
        var out = '';
        stdin
            .setEncoding('utf8')
            .on('readable', function () {
            var current;
            while ((current = stdin.read())) {
                out += current;
            }
        })
            .on('end', function () { return resolve(out); });
    });
}
/**
 * The "cli" step detects the appropriate input. If no input options are passed,
 * the package.json#main file is used.
 * After all the build steps have run, the output (the executable) is written to a file or piped to stdout.
 *
 * Configuration:
 *   - compiler.options.input - file path to the input bundle.
 *     - fallbacks: stdin, package.json#main
 *   - compiler.options.output - file path to the output executable.
 *     - fallbacks: stdout, nexe_ + epoch + ext
 *
 * @param {*} compiler
 * @param {*} next
 */
function cli(compiler, next) {
    return __awaiter(this, void 0, void 0, function () {
        var log, stdInUsed, _a, _b, target, deliverable;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    log = compiler.log;
                    stdInUsed = false;
                    if (!(!process.stdin.isTTY && compiler.options.enableStdIn)) return [3 /*break*/, 2];
                    stdInUsed = true;
                    _a = compiler;
                    _b = util_1.dequote;
                    return [4 /*yield*/, getStdIn(process.stdin)];
                case 1:
                    _a.input = _b.apply(void 0, [_c.sent()]);
                    _c.label = 2;
                case 2: return [4 /*yield*/, next()];
                case 3:
                    _c.sent();
                    target = compiler.options.targets.shift();
                    return [4 /*yield*/, compiler.compileAsync(target)];
                case 4:
                    deliverable = _c.sent();
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var step = log.step('Writing result to file');
                            deliverable
                                .pipe(fs_1.createWriteStream(path_1.normalize(compiler.output)))
                                .on('error', reject)
                                .once('close', function (e) {
                                if (e) {
                                    reject(e);
                                }
                                else if (compiler.output) {
                                    var output = compiler.output;
                                    var mode = fs_1.statSync(output).mode | 73;
                                    fs_1.chmodSync(output, mode.toString(8).slice(-3));
                                    var inputFile = path_1.relative(process.cwd(), compiler.options.input);
                                    var outputFile = path_1.relative(process.cwd(), output);
                                    step.log("Entry: '" + (stdInUsed ? (compiler.options.empty ? '[empty]' : '[stdin]') : inputFile) + "' written to: " + outputFile);
                                    resolve(compiler.quit());
                                }
                            });
                        })];
            }
        });
    });
}
exports.default = cli;
