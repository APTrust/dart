"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const process = require("process");
const realm_utils_1 = require("realm-utils");
const Utils_1 = require("./../Utils");
const ShimCollection_1 = require("./../ShimCollection");
const Server_1 = require("./../devServer/Server");
const JSONplugin_1 = require("./../plugins/JSONplugin");
const PathMaster_1 = require("./PathMaster");
const WorkflowContext_1 = require("./WorkflowContext");
const CollectionSource_1 = require("./../CollectionSource");
const Arithmetic_1 = require("./../arithmetic/Arithmetic");
const ModuleCollection_1 = require("./ModuleCollection");
const UserOutput_1 = require("./UserOutput");
const BundleProducer_1 = require("./BundleProducer");
const Bundle_1 = require("./Bundle");
const ExtensionOverrides_1 = require("./ExtensionOverrides");
const TypescriptConfig_1 = require("./TypescriptConfig");
const CombinedTargetAndLanguageLevel_1 = require("./CombinedTargetAndLanguageLevel");
const appRoot = require("app-root-path");
class FuseBox {
    constructor(opts) {
        this.opts = opts;
        this.producer = new BundleProducer_1.BundleProducer(this);
        Utils_1.printCurrentVersion();
        this.context = new WorkflowContext_1.WorkFlowContext();
        this.context.fuse = this;
        this.collectionSource = new CollectionSource_1.CollectionSource(this.context);
        opts = opts || {};
        let homeDir = appRoot.path;
        if (opts.writeBundles !== undefined) {
            this.context.userWriteBundles = opts.writeBundles;
        }
        if (opts.automaticAlias !== undefined) {
            this.context.automaticAlias = opts.automaticAlias;
        }
        const combination = new CombinedTargetAndLanguageLevel_1.CombinedTargetAndLanguageLevel(opts.target);
        this.context.target = combination.getTarget();
        this.context.forcedLanguageLevel = combination.getLanguageLevel();
        this.context.languageLevel = combination.getLanguageLevelOrDefault();
        if (opts.polyfillNonStandardDefaultUsage !== undefined) {
            this.context.deprecation("polyfillNonStandardDefaultUsage has been depreacted in favour of allowSyntheticDefaultImports");
            this.producer.allowSyntheticDefaultImports = opts.allowSyntheticDefaultImports;
        }
        if (opts.allowSyntheticDefaultImports !== undefined) {
            this.producer.allowSyntheticDefaultImports = opts.allowSyntheticDefaultImports;
        }
        if (opts.useJsNext !== undefined) {
            this.context.useJsNext = opts.useJsNext;
        }
        if (opts.dynamicImportsEnabled !== undefined) {
            this.context.dynamicImportsEnabled = opts.dynamicImportsEnabled;
        }
        if (opts.useTypescriptCompiler !== undefined) {
            this.context.useTypescriptCompiler = opts.useTypescriptCompiler;
        }
        if (opts.ensureTsConfig !== undefined) {
            this.context.ensureTsConfig = opts.ensureTsConfig;
        }
        if (opts.emitHMRDependencies === true) {
            this.context.emitHMRDependencies = true;
        }
        if (opts.homeDir) {
            homeDir = Utils_1.ensureUserPath(opts.homeDir);
        }
        if (opts.debug !== undefined) {
            this.context.debugMode = opts.debug;
        }
        if (opts.debug !== undefined) {
            this.context.debugMode = opts.debug;
        }
        if (opts.warnings !== undefined) {
            this.context.showWarnings = opts.warnings;
        }
        if (opts.showErrors !== undefined) {
            this.context.showErrors = opts.showErrors;
            if (opts.showErrorsInBrowser === undefined) {
                this.context.showErrorsInBrowser = opts.showErrors;
            }
        }
        if (opts.showErrorsInBrowser !== undefined) {
            this.context.showErrorsInBrowser = opts.showErrorsInBrowser;
        }
        if (opts.ignoreModules) {
            this.context.ignoreGlobal = opts.ignoreModules;
        }
        this.context.debugMode = opts.debug !== undefined ? opts.debug : Utils_1.contains(process.argv, "--debug");
        let modulesFolders = opts.modulesFolder;
        if (modulesFolders) {
            if (!Array.isArray(modulesFolders)) {
                modulesFolders = [modulesFolders];
            }
            modulesFolders = modulesFolders.map(folder => Utils_1.ensureUserPath(folder));
            this.context.customModulesFolder = modulesFolders;
        }
        else {
            this.context.customModulesFolder = [];
        }
        if (opts.sourceMaps) {
            this.context.setSourceMapsProperty(opts.sourceMaps);
        }
        this.context.runAllMatchedPlugins = !!opts.runAllMatchedPlugins;
        this.context.plugins = opts.plugins || [JSONplugin_1.JSONPlugin()];
        if (opts.package) {
            if (realm_utils_1.utils.isPlainObject(opts.package)) {
                const packageOptions = opts.package;
                this.context.defaultPackageName = packageOptions.name || "default";
                this.context.defaultEntryPoint = packageOptions.main;
            }
            else if (typeof opts.package === "string") {
                this.context.defaultPackageName = opts.package;
            }
            else {
                throw new Error("`package` must be a string or an object of the form {name: string, main: string}");
            }
        }
        if (opts.cache !== undefined) {
            if (typeof opts.cache === "string") {
                this.context.cache = opts.cache;
            }
            this.context.useCache = opts.cache ? true : false;
        }
        if (opts.filterFile) {
            this.context.filterFile = opts.filterFile;
        }
        if (typeof opts.log === "boolean") {
            this.context.log.printLog = opts.log;
        }
        if (typeof opts.log === "object") {
            this.context.log.printLog = opts.log.enabled !== false;
            this.context.log.showBundledFiles = opts.log.showBundledFiles;
        }
        if (opts.hash !== undefined) {
            this.context.hash = opts.hash;
        }
        if (opts.alias) {
            this.context.addAlias(opts.alias);
        }
        this.context.initAutoImportConfig(opts.natives, opts.autoImport);
        if (opts.globals) {
            this.context.globals = opts.globals;
        }
        if (opts.shim) {
            this.context.shim = opts.shim;
        }
        if (opts.standalone !== undefined) {
            this.context.standaloneBundle = opts.standalone;
        }
        if (opts.customAPIFile) {
            this.context.customAPIFile = opts.customAPIFile;
        }
        this.context.setHomeDir(homeDir);
        if (opts.cache !== undefined) {
            this.context.setUseCache(opts.cache);
        }
        this.virtualFiles = opts.files;
        if (opts.output) {
            this.context.output = new UserOutput_1.UserOutput(this.context, opts.output);
        }
        if (opts.extensionOverrides) {
            this.context.extensionOverrides = new ExtensionOverrides_1.ExtensionOverrides(opts.extensionOverrides);
        }
        const tsConfig = new TypescriptConfig_1.TypescriptConfig(this.context);
        tsConfig.setConfigFile(opts.tsConfig);
        this.context.tsConfig = tsConfig;
        if (opts.stdin) {
            process.stdin.on("end", () => {
                process.exit(0);
            });
            process.stdin.resume();
        }
    }
    static init(opts) {
        return new FuseBox(opts);
    }
    triggerPre() {
        this.context.triggerPluginsMethodOnce("preBundle", [this.context]);
    }
    triggerStart() {
        this.context.triggerPluginsMethodOnce("bundleStart", [this.context]);
    }
    triggerEnd() {
        this.context.triggerPluginsMethodOnce("bundleEnd", [this.context]);
    }
    triggerPost() {
        this.context.triggerPluginsMethodOnce("postBundle", [this.context]);
    }
    copy() {
        const config = { ...this.opts };
        config.plugins = [].concat(config.plugins || []);
        return FuseBox.init(config);
    }
    bundle(name, arithmetics) {
        const fuse = this.copy();
        const bundle = new Bundle_1.Bundle(name, fuse, this.producer);
        bundle.arithmetics = arithmetics;
        this.producer.add(name, bundle);
        return bundle;
    }
    sendPageReload() {
        if (this.producer.devServer && this.producer.devServer.socketServer) {
            const socket = this.producer.devServer.socketServer;
            socket.send("page-reload", []);
        }
    }
    sendPageHMR() {
        if (this.producer.devServer && this.producer.devServer.socketServer) {
            const socket = this.producer.devServer.socketServer;
            socket.send("page-hmr", []);
        }
    }
    dev(opts, fn) {
        opts = opts || {};
        opts.port = opts.port || 4444;
        this.producer.devServerOptions = opts;
        this.producer.runner.bottom(() => {
            const server = new Server_1.Server(this);
            this.producer.devServer = server;
            server.start(opts);
            if (opts.open) {
                try {
                    const opn = require("opn");
                    opn(typeof opts.open === "string" ? opts.open : `http://localhost:${opts.port}`);
                }
                catch (e) {
                    this.context.log.echoRed('If you want to open the browser, please install "opn" package. "npm install opn --save-dev"');
                }
            }
            if (fn) {
                fn(server);
            }
        });
    }
    register(packageName, opts) {
        this.producer.runner.top(() => {
            return this.producer.register(packageName, opts);
        });
    }
    run(opts) {
        return this.producer.run(opts);
    }
    process(bundleData, bundleReady) {
        if (typeof this.opts.log === "object" && this.opts.log.clearTerminalOnBundle) {
            this.context.log.clearTerminal();
        }
        const bundleCollection = new ModuleCollection_1.ModuleCollection(this.context, this.context.defaultPackageName);
        bundleCollection.pm = new PathMaster_1.PathMaster(this.context, bundleData.homeDir);
        if (bundleData.typescriptMode) {
            this.context.tsMode = true;
            bundleCollection.pm.setTypeScriptMode();
        }
        const self = this;
        return bundleCollection.collectBundle(bundleData).then(module => {
            if (this.context.emitHMRDependencies) {
                this.context.emitter.emit("bundle-collected");
            }
            this.context.log.bundleStart(this.context.bundle.name);
            return realm_utils_1.chain(class extends realm_utils_1.Chainable {
                constructor() {
                    super(...arguments);
                    this.globalContents = [];
                }
                setDefaultCollection() {
                    return bundleCollection;
                }
                addDefaultContents() {
                    return self.collectionSource.get(this.defaultCollection).then((cnt) => {
                        self.context.log.echoDefaultCollection(this.defaultCollection, cnt);
                    });
                }
                addNodeModules() {
                    const nodeModules = new Map(Array.from(self.context.nodeModules).sort());
                    return realm_utils_1.each(nodeModules, (collection) => {
                        if (collection.cached || (collection.info && !collection.info.missing)) {
                            return self.collectionSource.get(collection).then((cnt) => {
                                self.context.log.echoCollection(collection, cnt);
                                if (!collection.cachedName && self.context.useCache) {
                                    self.context.cache.set(collection.info, cnt);
                                }
                                this.globalContents.push(cnt);
                            });
                        }
                    });
                }
                format() {
                    return {
                        contents: this.globalContents,
                    };
                }
            }).then(result => {
                const self = this;
                self.context.log.end();
                this.triggerEnd();
                self.context.source.finalize(bundleData);
                this.triggerPost();
                this.context.writeOutput(bundleReady);
                return self.context.source.getResult();
            });
        });
    }
    addShims() {
        const shim = this.context.shim;
        if (shim) {
            for (const name in shim) {
                if (shim.hasOwnProperty(name)) {
                    const data = shim[name];
                    if (data.exports) {
                        const shimedCollection = ShimCollection_1.ShimCollection.create(this.context, name, data.exports);
                        this.context.addNodeModule(name, shimedCollection);
                        if (data.source) {
                            const source = Utils_1.ensureUserPath(data.source);
                            const contents = fs.readFileSync(source).toString();
                            this.context.source.addContent(contents);
                        }
                    }
                }
            }
        }
    }
    initiateBundle(str, bundleReady) {
        this.context.reset();
        this.context.defer.lock();
        this.triggerPre();
        this.context.source.init();
        this.addShims();
        this.triggerStart();
        const parser = Arithmetic_1.Arithmetic.parse(str);
        let bundle;
        return Arithmetic_1.Arithmetic.getFiles(parser, this.virtualFiles, this.context.homeDir)
            .then(data => {
            bundle = data;
            if (bundle.tmpFolder) {
                this.context.homeDir = bundle.tmpFolder;
            }
            if (bundle.standalone !== undefined) {
                this.context.debug("Arithmetic", `Override standalone ${bundle.standalone}`);
                this.context.standaloneBundle = bundle.standalone;
            }
            if (bundle.cache !== undefined) {
                this.context.debug("Arithmetic", `Override cache ${bundle.cache}`);
                this.context.useCache = bundle.cache;
            }
            return this.process(data, bundleReady);
        })
            .then(contents => {
            bundle.finalize();
            return contents;
        })
            .catch(e => {
            console.log(e.stack || e);
            throw e;
        });
    }
}
exports.FuseBox = FuseBox;
process.on("unhandledRejection", (reason, promise) => {
    console.log(reason.stack);
});
