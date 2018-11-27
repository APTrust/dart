"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../Utils");
const events_1 = require("events");
const Arithmetic_1 = require("../arithmetic/Arithmetic");
const SharedCustomPackage_1 = require("./SharedCustomPackage");
const BundleRunner_1 = require("./BundleRunner");
const chokidar = require("chokidar");
const realm_utils_1 = require("realm-utils");
const ProducerAbstraction_1 = require("../quantum/core/ProducerAbstraction");
const BundleAbstraction_1 = require("../quantum/core/BundleAbstraction");
class BundleProducer {
    constructor(fuse) {
        this.fuse = fuse;
        this.bundles = new Map();
        this.hmrInjected = false;
        this.hmrAllowed = true;
        this.allowSyntheticDefaultImports = false;
        this.sharedSourceMaps = new Map();
        this.injectedCSSFiles = new Set();
        this.sharedEvents = new events_1.EventEmitter();
        this.writeBundles = true;
        this.userEnvVariables = Object.assign({ NODE_ENV: "production" }, process.env);
        this.injectedCode = new Map();
        this.warnings = new Map();
        this.runner = new BundleRunner_1.BundleRunner(this.fuse);
    }
    run(opts) {
        if (opts) {
            this.chokidarOptions = opts.chokidar;
            this.chokidarPaths = opts.chokidarPaths;
        }
        this.watch();
        return this.runner
            .run(opts)
            .then(() => {
            this.sharedEvents.emit("producer-done");
            this.printWarnings();
            return realm_utils_1.each(this.fuse.context.plugins, plugin => {
                if (plugin && realm_utils_1.utils.isFunction(plugin.producerEnd)) {
                    return plugin.producerEnd(this);
                }
            });
        })
            .then(() => {
            return this;
        });
    }
    addUserProcessEnvVariables(data) {
        this.userEnvVariables = Object.assign(this.userEnvVariables, data);
    }
    printWarnings() {
        if (this.warnings.size > 0 && this.fuse.context.showWarnings) {
            this.fuse.context.log.echoBreak();
            this.warnings.forEach(warnings => {
                warnings.forEach(list => {
                    this.fuse.context.log.echoWarning(list);
                });
            });
            this.fuse.context.log.echoBreak();
        }
    }
    addWarning(key, message) {
        let list;
        if (!this.warnings.has(key)) {
            list = [];
            this.warnings.set(key, list);
        }
        else {
            list = this.warnings.get(key);
        }
        list.push(message);
    }
    getErrors() {
        const errors = [];
        this.bundles.forEach(bundle => errors.push(...bundle.getErrors()));
        return errors;
    }
    devCodeHasBeenInjected(key) {
        return this.injectedCode.has(key);
    }
    getDevInjections() {
        return this.injectedCode;
    }
    injectDevCode(key, code) {
        if (!this.injectedCode.has(key)) {
            this.injectedCode.set(key, code);
        }
    }
    sortBundles() {
        let bundles = [...this.bundles.values()];
        bundles = bundles.sort((a, b) => {
            if (a.webIndexPriority < b.webIndexPriority) {
                return 1;
            }
            if (a.webIndexPriority > b.webIndexPriority) {
                return -1;
            }
            return 0;
        });
        return bundles;
    }
    generateAbstraction(opts) {
        const abstraction = new ProducerAbstraction_1.ProducerAbstraction(opts);
        return realm_utils_1.each(this.bundles, (bundle) => {
            const bundleAbstraction = new BundleAbstraction_1.BundleAbstraction(bundle.name);
            abstraction.registerBundleAbstraction(bundleAbstraction);
            return bundleAbstraction.parse(bundle.generatedCode.toString());
        }).then(() => {
            return abstraction;
        });
    }
    register(packageName, opts) {
        let instructions = opts.instructions;
        if (!packageName) {
            throw new Error("Package name is required");
        }
        if (!opts.homeDir) {
            throw new Error("Register requires homeDir!");
        }
        let homeDir = Utils_1.ensureUserPath(opts.homeDir);
        if (!instructions) {
            throw new Error("Register requires opts.instructions!");
        }
        let parser = Arithmetic_1.Arithmetic.parse(instructions);
        if (!this.sharedCustomPackages) {
            this.sharedCustomPackages = new Map();
        }
        return Arithmetic_1.Arithmetic.getFiles(parser, false, homeDir).then((data) => {
            let pkg = new SharedCustomPackage_1.SharedCustomPackage(packageName, data);
            pkg.init(homeDir, opts.main || "index.js");
            this.sharedCustomPackages.set(packageName, pkg);
        });
    }
    isShared(name) {
        return this.sharedCustomPackages && this.sharedCustomPackages.get(name);
    }
    getSharedPackage(name) {
        return this.sharedCustomPackages.get(name);
    }
    add(name, bundle) {
        this.bundles.set(name, bundle);
        this.runner.bundle(bundle);
    }
    watch() {
        let settings = new Map();
        let isRequired = false;
        this.bundles.forEach(bundle => {
            if (bundle.watchRule) {
                isRequired = true;
                settings.set(bundle.name, Utils_1.string2RegExp(bundle.watchRule));
            }
        });
        if (!isRequired) {
            return;
        }
        let ready = false;
        chokidar
            .watch(this.chokidarPaths || this.fuse.context.homeDir, this.chokidarOptions || {})
            .on("all", (event, fp) => {
            if (ready) {
                this.onChanges(settings, fp);
            }
        })
            .on("ready", () => {
            ready = true;
        });
    }
    onChanges(settings, path) {
        path = Utils_1.ensureFuseBoxPath(path);
        settings.forEach((expression, bundleName) => {
            if (expression.test(path)) {
                const bundle = this.bundles.get(bundleName);
                if (bundle.watchFilterFn && !bundle.watchFilterFn(path)) {
                    return;
                }
                const defer = bundle.fuse.context.defer;
                bundle.lastChangedFile = bundle.fuse.context.convertToFuseBoxPath(path);
                defer.queue(bundleName, () => {
                    return bundle.exec().then(result => {
                        this.sharedEvents.emit("file-changed", [bundle, path]);
                        return result;
                    });
                });
            }
        });
    }
}
exports.BundleProducer = BundleProducer;
