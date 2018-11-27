"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FuseBox_1 = require("./FuseBox");
const FuseProcess_1 = require("../FuseProcess");
const HotReloadPlugin_1 = require("../plugins/HotReloadPlugin");
const path = require("path");
const BundleTestRunner_1 = require("../BundleTestRunner");
const Config_1 = require("../Config");
const EventEmitter_1 = require("../EventEmitter");
const ExtensionOverrides_1 = require("./ExtensionOverrides");
const CombinedTargetAndLanguageLevel_1 = require("./CombinedTargetAndLanguageLevel");
class Bundle {
    constructor(name, fuse, producer) {
        this.name = name;
        this.fuse = fuse;
        this.producer = producer;
        this.process = new FuseProcess_1.FuseProcess(this);
        this.webIndexPriority = 0;
        this.webIndexed = true;
        this.errors = [];
        this.errorEmitter = new EventEmitter_1.EventEmitter();
        this.clearErrorEmitter = new EventEmitter_1.EventEmitter();
        this.context = fuse.context;
        this.context.bundle = this;
        fuse.producer = producer;
        this.setup();
    }
    watch(ruleOrFilterFn, filterFn) {
        if (typeof ruleOrFilterFn === 'function') {
            this.watchRule = "**";
            this.watchFilterFn = ruleOrFilterFn;
        }
        else {
            this.watchRule = ruleOrFilterFn || "**";
            this.watchFilterFn = filterFn;
        }
        return this;
    }
    globals(globals) {
        this.context.globals = globals;
        return this;
    }
    tsConfig(fpath) {
        this.context.tsConfig.setConfigFile(fpath);
        return this;
    }
    shim(shimConfig) {
        this.context.shim = shimConfig;
        return this;
    }
    hmr(opts) {
        if (!this.producer.hmrAllowed) {
            return this;
        }
        if (!this.producer.hmrInjected) {
            opts = opts || {};
            opts.port = (this.producer.devServerOptions && this.producer.devServerOptions.port) || 4444;
            let plugin = HotReloadPlugin_1.HotReloadPlugin({ port: opts.port, uri: opts.socketURI, reload: opts.reload });
            this.context.plugins = this.context.plugins || [];
            this.context.plugins.push(plugin);
            this.producer.hmrInjected = true;
        }
        this.producer.sharedEvents.on("SocketServerReady", (server) => {
            this.fuse.context.sourceChangedEmitter.on(info => {
                if (this.fuse.context.isFirstTime() === false) {
                    this.fuse.context.log.echo(`Source changed for ${info.path}`);
                    server.send("source-changed", info);
                }
            });
            if (this.context.showErrorsInBrowser) {
                const type = "update-bundle-errors", getData = () => ({
                    bundleName: this.name,
                    messages: this.errors,
                });
                this.errorEmitter.on(message => {
                    server.send("bundle-error", {
                        bundleName: this.name,
                        message,
                    });
                });
                this.clearErrorEmitter.on(() => {
                    server.send(type, getData());
                });
                server.server.on("connection", client => {
                    client.send(JSON.stringify({
                        type,
                        data: getData(),
                    }));
                });
            }
        });
        return this;
    }
    alias(key, value) {
        this.context.addAlias(key, value);
        return this;
    }
    split(name, filePath) {
        this.producer.fuse.context.nameSplit(name, filePath);
        return this;
    }
    cache(cache) {
        this.context.useCache = cache;
        return this;
    }
    splitConfig(opts) {
        this.producer.fuse.context.configureQuantumSplitResolving(opts);
        return this;
    }
    log(log) {
        this.context.doLog = log;
        this.context.log.printLog = log;
        return this;
    }
    extensionOverrides(...overrides) {
        if (!this.context.extensionOverrides) {
            this.context.extensionOverrides = new ExtensionOverrides_1.ExtensionOverrides(overrides);
        }
        else {
            overrides.forEach(override => this.context.extensionOverrides.add(override));
        }
        return this;
    }
    plugin(...args) {
        this.context.plugins = this.context.plugins || [];
        this.context.plugins.push(args.length === 1 ? args[0] : args);
        return this;
    }
    natives(opts) {
        this.context.natives = opts;
        return this;
    }
    instructions(arithmetics) {
        this.arithmetics = arithmetics;
        return this;
    }
    target(target) {
        const combination = new CombinedTargetAndLanguageLevel_1.CombinedTargetAndLanguageLevel(target);
        this.context.target = combination.getTarget();
        this.context.forcedLanguageLevel = combination.getLanguageLevel();
        this.context.languageLevel = combination.getLanguageLevelOrDefault();
        return this;
    }
    sourceMaps(params) {
        this.context.setSourceMapsProperty(params);
        return this;
    }
    test(str = "**/*.test.ts", opts) {
        opts = opts || {};
        opts.reporter = opts.reporter || "fuse-test-reporter";
        opts.exit = true;
        const clonedOpts = Object.assign({}, this.fuse.opts);
        const testBundleFile = path.join(Config_1.Config.TEMP_FOLDER, "tests", new Date().getTime().toString(), "/$name.js");
        clonedOpts.output = testBundleFile;
        str += ` +fuse-test-runner ${opts.reporter} -ansi`;
        const fuse = FuseBox_1.FuseBox.init(clonedOpts);
        fuse
            .bundle("test")
            .instructions(str)
            .completed(proc => {
            const bundle = require(proc.filePath);
            let runner = new BundleTestRunner_1.BundleTestRunner(bundle, opts);
            runner.start();
        });
        fuse.run();
    }
    exec() {
        return new Promise((resolve, reject) => {
            this.clearErrors();
            this.fuse
                .initiateBundle(this.arithmetics || "", () => {
                const output = this.fuse.context.output;
                this.process.setFilePath(output.lastPrimaryOutput ? output.lastPrimaryOutput.path : output.lastGeneratedFileName);
                if (this.onDoneCallback && this.producer.writeBundles === true) {
                    this.onDoneCallback(this.process);
                }
                this.printErrors();
                return resolve(this);
            })
                .then(source => { })
                .catch(e => {
                console.error(e);
                return reject(e);
            });
            return this;
        });
    }
    completed(fn) {
        this.onDoneCallback = fn;
        return this;
    }
    setup() {
        this.context.output.setName(this.name);
        if (this.context.useCache) {
            this.context.initCache();
            this.context.cache.initialize();
        }
    }
    clearErrors() {
        this.errors = [];
        this.clearErrorEmitter.emit(null);
    }
    addError(message) {
        this.errors.push(message);
        this.errorEmitter.emit(message);
    }
    getErrors() {
        return this.errors.slice();
    }
    printErrors() {
        if (this.errors.length && this.fuse.context.showErrors) {
            this.fuse.context.log.echoBreak();
            this.fuse.context.log.echoBoldRed(`Errors for ${this.name} bundle`);
            this.errors.forEach(error => this.fuse.context.log.echoError(error));
            this.fuse.context.log.echoBreak();
        }
    }
}
exports.Bundle = Bundle;
