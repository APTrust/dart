"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var buffer_1 = require("buffer");
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var stream_1 = require("stream");
var child_process_1 = require("child_process");
var logger_1 = require("./logger");
var util_1 = require("./util");
var options_1 = require("./options");
var download = require("download");
var releases_1 = require("./releases");
var isBsd = Boolean(~process.platform.indexOf('bsd'));
var make = util_1.isWindows ? 'vcbuild.bat' : isBsd ? 'gmake' : 'make';
var configure = util_1.isWindows ? 'configure' : './configure';
var NexeCompiler = /** @class */ (function () {
    function NexeCompiler(options) {
        this.options = options;
        this.start = Date.now();
        this.log = new logger_1.Logger(this.options.loglevel);
        this.files = [];
        this.shims = [];
        this.resources = {
            index: {},
            bundle: buffer_1.Buffer.from('')
        };
        this.output = this.options.output;
        var python = (this.options = options).python;
        this.targets = options.targets;
        this.target = this.targets[0];
        this.src = path_1.join(this.options.temp, this.target.version);
        this.nodeSrcBinPath = util_1.isWindows
            ? path_1.join(this.src, 'Release', 'node.exe')
            : path_1.join(this.src, 'out', 'Release', 'node');
        this.log.step('nexe ' + options_1.version, 'info');
        if (util_1.isWindows) {
            var originalPath = process.env.PATH;
            delete process.env.PATH;
            this.env = __assign({}, process.env);
            this.env.PATH = python
                ? (this.env.PATH = util_1.dequote(path_1.normalize(python)) + path_1.delimiter + originalPath)
                : originalPath;
            process.env.PATH = originalPath;
        }
        else {
            this.env = __assign({}, process.env);
            python && (this.env.PYTHON = python);
        }
    }
    NexeCompiler.prototype.addResource = function (file, contents) {
        var resources = this.resources;
        resources.index[file] = [resources.bundle.byteLength, contents.byteLength];
        resources.bundle = buffer_1.Buffer.concat([resources.bundle, contents]);
    };
    NexeCompiler.prototype.readFileAsync = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var cachedFile, absPath, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.assertBuild();
                        cachedFile = this.files.find(function (x) { return path_1.normalize(x.filename) === path_1.normalize(file); });
                        if (!!cachedFile) return [3 /*break*/, 2];
                        absPath = path_1.join(this.src, file);
                        _a = {
                            absPath: absPath,
                            filename: file
                        };
                        return [4 /*yield*/, util_1.readFileAsync(absPath, 'utf-8').catch(function (x) {
                                if (x.code === 'ENOENT')
                                    return '';
                                throw x;
                            })];
                    case 1:
                        cachedFile = (_a.contents = _b.sent(),
                            _a);
                        this.files.push(cachedFile);
                        _b.label = 2;
                    case 2: return [2 /*return*/, cachedFile];
                }
            });
        });
    };
    NexeCompiler.prototype.writeFileAsync = function (file, contents) {
        this.assertBuild();
        return util_1.writeFileAsync(path_1.join(this.src, file), contents);
    };
    NexeCompiler.prototype.replaceInFileAsync = function (file, replace, value) {
        return __awaiter(this, void 0, void 0, function () {
            var entry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.readFileAsync(file)];
                    case 1:
                        entry = _a.sent();
                        entry.contents = entry.contents.replace(replace, value);
                        return [2 /*return*/];
                }
            });
        });
    };
    NexeCompiler.prototype.setFileContentsAsync = function (file, contents) {
        return __awaiter(this, void 0, void 0, function () {
            var entry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.readFileAsync(file)];
                    case 1:
                        entry = _a.sent();
                        entry.contents = contents;
                        return [2 /*return*/];
                }
            });
        });
    };
    NexeCompiler.prototype.quit = function () {
        var time = Date.now() - this.start;
        this.log.write("Finished in " + time / 1000 + "s");
        return this.log.flush();
    };
    NexeCompiler.prototype.assertBuild = function () {
        if (!this.options.build) {
            throw new Error('This feature is only available with `--build`');
        }
    };
    NexeCompiler.prototype.getNodeExecutableLocation = function (target) {
        if (target) {
            return path_1.join(this.options.temp, target.toString());
        }
        return this.nodeSrcBinPath;
    };
    NexeCompiler.prototype._runBuildCommandAsync = function (command, args) {
        var _this = this;
        if (this.log.verbose) {
            this.compileStep.pause();
        }
        return new Promise(function (resolve, reject) {
            child_process_1.spawn(command, args, {
                cwd: _this.src,
                env: _this.env,
                stdio: _this.log.verbose ? 'inherit' : 'ignore'
            })
                .once('error', function (e) {
                if (_this.log.verbose) {
                    _this.compileStep.resume();
                }
                reject(e);
            })
                .once('close', function (code) {
                if (_this.log.verbose) {
                    _this.compileStep.resume();
                }
                if (code != 0) {
                    var error = command + " " + args.join(' ') + " exited with code: " + code;
                    reject(new Error(error));
                }
                resolve();
            });
        });
    };
    NexeCompiler.prototype._configureAsync = function () {
        return this._runBuildCommandAsync(this.env.PYTHON || 'python', [
            configure
        ].concat(this.options.configure));
    };
    NexeCompiler.prototype._buildAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var buildOptions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.compileStep.log("Configuring node build" + (this.options.configure.length ? ': ' + this.options.configure : '...'));
                        return [4 /*yield*/, this._configureAsync()];
                    case 1:
                        _a.sent();
                        buildOptions = this.options.make;
                        this.compileStep.log("Compiling Node" + (buildOptions.length ? ' with arguments: ' + buildOptions : '...'));
                        return [4 /*yield*/, this._runBuildCommandAsync(make, buildOptions)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, fs_1.createReadStream(this.getNodeExecutableLocation())];
                }
            });
        });
    };
    NexeCompiler.prototype._fetchPrebuiltBinaryAsync = function (target) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var downloadOptions, githubRelease, assetName, asset, filename;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        downloadOptions = this.options.downloadOptions;
                        if (this.options.ghToken) {
                            downloadOptions = Object.assign({}, downloadOptions);
                            downloadOptions.headers = Object.assign({}, downloadOptions.headers, {
                                Authorization: 'token ' + this.options.ghToken
                            });
                        }
                        return [4 /*yield*/, releases_1.getLatestGitRelease(downloadOptions)];
                    case 1:
                        githubRelease = _a.sent();
                        assetName = target.toString();
                        asset = githubRelease.assets.find(function (x) { return x.name === assetName; });
                        if (!asset) {
                            throw new Error(assetName + " not available, create it using the --build flag");
                        }
                        filename = this.getNodeExecutableLocation(target);
                        return [4 /*yield*/, download(asset.browser_download_url, path_1.dirname(filename), this.options.downloadOptions).on('response', function (res) {
                                var total = +res.headers['content-length'];
                                var current = 0;
                                res.on('data', function (data) {
                                    current += data.length;
                                    _this.compileStep.modify("Downloading..." + (current / total * 100).toFixed() + "%");
                                });
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, fs_1.createReadStream(filename)];
                }
            });
        });
    };
    NexeCompiler.prototype.getHeader = function () {
        var _this = this;
        var version = ['configure', 'vcBuild', 'make'].reduce(function (a, c) {
            return (a += _this.options[c]
                .slice()
                .sort()
                .join());
        }, '') + this.options.enableNodeCli;
        var header = {
            resources: this.resources.index,
            version: crypto_1.createHash('md5')
                .update(version)
                .digest('hex')
        };
        return "process.__nexe=" + JSON.stringify(header) + ";";
    };
    NexeCompiler.prototype.compileAsync = function (target) {
        return __awaiter(this, void 0, void 0, function () {
            var step, build, location, binary;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        step = (this.compileStep = this.log.step('Compiling result'));
                        build = this.options.build;
                        location = this.getNodeExecutableLocation(build ? undefined : target);
                        return [4 /*yield*/, util_1.pathExistsAsync(location)];
                    case 1:
                        binary = (_a.sent()) ? fs_1.createReadStream(location) : null;
                        if (!(!build && !binary)) return [3 /*break*/, 3];
                        step.modify('Fetching prebuilt binary');
                        return [4 /*yield*/, this._fetchPrebuiltBinaryAsync(target)];
                    case 2:
                        binary = _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!!binary) return [3 /*break*/, 5];
                        return [4 /*yield*/, this._buildAsync()];
                    case 4:
                        binary = _a.sent();
                        step.log('Node binary compiled');
                        _a.label = 5;
                    case 5: return [2 /*return*/, this._assembleDeliverable(binary)];
                }
            });
        });
    };
    NexeCompiler.prototype.code = function () {
        return [this.shims.join(''), this.input].join(';');
    };
    NexeCompiler.prototype._assembleDeliverable = function (binary) {
        var _this = this;
        if (this.options.empty) {
            return binary;
        }
        var artifact = new stream_1.Readable({ read: function () { } });
        binary.on('data', function (chunk) {
            artifact.push(chunk);
        });
        binary.on('close', function () {
            var content = _this.code();
            artifact.push(content);
            artifact.push(_this.resources.bundle);
            var lengths = buffer_1.Buffer.from(Array(16));
            lengths.writeDoubleLE(buffer_1.Buffer.byteLength(content), 0);
            lengths.writeDoubleLE(_this.resources.bundle.byteLength, 8);
            artifact.push(buffer_1.Buffer.concat([buffer_1.Buffer.from('<nexe~~sentinel>'), lengths]));
            artifact.push(null);
        });
        return artifact;
    };
    __decorate([
        util_1.bound
    ], NexeCompiler.prototype, "addResource", null);
    __decorate([
        util_1.bound
    ], NexeCompiler.prototype, "readFileAsync", null);
    __decorate([
        util_1.bound
    ], NexeCompiler.prototype, "writeFileAsync", null);
    __decorate([
        util_1.bound
    ], NexeCompiler.prototype, "replaceInFileAsync", null);
    __decorate([
        util_1.bound
    ], NexeCompiler.prototype, "setFileContentsAsync", null);
    return NexeCompiler;
}());
exports.NexeCompiler = NexeCompiler;
