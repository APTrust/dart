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
var util_1 = require("../util");
var path_1 = require("path");
var fuse_native_module_plugin_1 = require("../bundling/fuse-native-module-plugin");
function createBundle(options) {
    var _a = require('fuse-box'), FuseBox = _a.FuseBox, JSONPlugin = _a.JSONPlugin, CSSPlugin = _a.CSSPlugin, HTMLPlugin = _a.HTMLPlugin, QuantumPlugin = _a.QuantumPlugin;
    var plugins = [JSONPlugin(), CSSPlugin(), HTMLPlugin(), fuse_native_module_plugin_1.default(options.native)];
    if (options.compress) {
        plugins.push(QuantumPlugin({
            target: 'server@esnext',
            uglify: true,
            bakeApiIntoBundle: options.name
        }));
    }
    var cwd = options.cwd;
    var fuse = FuseBox.init({
        cache: false,
        log: Boolean(process.env.NEXE_BUNDLE_LOG) || false,
        homeDir: cwd,
        sourceMaps: false,
        writeBundles: false,
        output: '$name.js',
        target: 'server@esnext',
        plugins: plugins
    });
    var input = path_1.relative(cwd, path_1.resolve(cwd, options.input)).replace(/\\/g, '/');
    fuse.bundle(options.name).instructions("> " + input);
    return fuse.run().then(function (x) {
        var output = '';
        x.bundles.forEach(function (y) { return (output = y.context.output.lastPrimaryOutput.content.toString()); });
        return output;
    });
}
function bundle(compiler, next) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, bundle, cwd, empty, input, _b, producer, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = compiler.options, bundle = _a.bundle, cwd = _a.cwd, empty = _a.empty, input = _a.input;
                    if (!!bundle) return [3 /*break*/, 2];
                    _b = compiler;
                    return [4 /*yield*/, util_1.readFileAsync(path_1.resolve(cwd, input), 'utf-8')];
                case 1:
                    _b.input = _d.sent();
                    return [2 /*return*/, next()];
                case 2:
                    if (compiler.options.empty || !compiler.options.input) {
                        compiler.input = '';
                        return [2 /*return*/, next()];
                    }
                    producer = createBundle;
                    if (typeof bundle === 'string') {
                        producer = require(path_1.resolve(cwd, bundle)).createBundle;
                    }
                    _c = compiler;
                    return [4 /*yield*/, producer(compiler.options)];
                case 3:
                    _c.input = _d.sent();
                    if (!('string' === typeof compiler.options.debugBundle)) return [3 /*break*/, 5];
                    return [4 /*yield*/, util_1.writeFileAsync(path_1.resolve(cwd, compiler.options.debugBundle), compiler.input)];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5: return [2 /*return*/, next()];
            }
        });
    });
}
exports.default = bundle;
