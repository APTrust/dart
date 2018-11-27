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
var os_1 = require("os");
var app_builder_1 = require("app-builder");
var util_1 = require("./util");
var compiler_1 = require("./compiler");
exports.NexeCompiler = compiler_1.NexeCompiler;
var options_1 = require("./options");
var resource_1 = require("./steps/resource");
var cli_1 = require("./steps/cli");
var bundle_1 = require("./steps/bundle");
var download_1 = require("./steps/download");
var shim_1 = require("./steps/shim");
var artifacts_1 = require("./steps/artifacts");
var patches_1 = require("./patches");
function compile(compilerOptions, callback) {
    return __awaiter(this, void 0, void 0, function () {
        var options, compiler, build, path, step, buildSteps, nexe, error, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = options_1.normalizeOptions(compilerOptions);
                    compiler = new compiler_1.NexeCompiler(options);
                    build = compiler.options.build;
                    if (!options.clean) return [3 /*break*/, 2];
                    path = compiler.src;
                    if (!options.build) {
                        path = compiler.getNodeExecutableLocation(compiler.options.targets[0]);
                    }
                    step = compiler.log.step('Cleaning up nexe build artifacts...');
                    step.log("Deleting contents at: " + path);
                    return [4 /*yield*/, util_1.rimrafAsync(path)];
                case 1:
                    _a.sent();
                    step.log("Deleted contents at: " + path);
                    return [2 /*return*/, compiler.quit()];
                case 2:
                    buildSteps = build
                        ? [download_1.default, artifacts_1.default].concat(patches_1.default, options.patches) : [];
                    nexe = app_builder_1.compose(resource_1.default, bundle_1.default, shim_1.default, cli_1.default, buildSteps, options.plugins);
                    error = null;
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, nexe(compiler)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    error = e_1;
                    return [3 /*break*/, 6];
                case 6:
                    if (error) {
                        if (compiler.options.loglevel !== 'silent' && error) {
                            process.stderr.write(os_1.EOL + error.stack + os_1.EOL);
                        }
                        compiler.quit();
                        if (callback)
                            return [2 /*return*/, callback(error)];
                        return [2 /*return*/, Promise.reject(error)];
                    }
                    if (callback)
                        callback(null);
                    return [2 /*return*/];
            }
        });
    });
}
exports.compile = compile;
var options_2 = require("./options");
exports.argv = options_2.argv;
exports.version = options_2.version;
exports.help = options_2.help;
