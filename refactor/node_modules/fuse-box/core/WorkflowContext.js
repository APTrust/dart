"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const escodegen = require("escodegen");
const BundleSource_1 = require("../BundleSource");
const File_1 = require("./File");
const Log_1 = require("../Log");
const NativeEmitter = require("events");
const PathMaster_1 = require("./PathMaster");
const ModuleCache_1 = require("../ModuleCache");
const EventEmitter_1 = require("../EventEmitter");
const realm_utils_1 = require("realm-utils");
const Utils_1 = require("../Utils");
const AutoImportedModule_1 = require("./AutoImportedModule");
const Defer_1 = require("../Defer");
const QuantumSplit_1 = require("../quantum/plugin/QuantumSplit");
const ServerPolyfillList_1 = require("./ServerPolyfillList");
const CSSDependencyExtractor_1 = require("../lib/CSSDependencyExtractor");
const appRoot = require("app-root-path");
class WorkFlowContext {
    constructor() {
        this.appRoot = appRoot.path;
        this.dynamicImportsEnabled = true;
        this.automaticAlias = true;
        this.writeBundles = true;
        this.useTypescriptCompiler = false;
        this.userWriteBundles = true;
        this.showWarnings = true;
        this.ensureTsConfig = true;
        this.useJsNext = false;
        this.showErrors = true;
        this.showErrorsInBrowser = true;
        this.sourceChangedEmitter = new EventEmitter_1.EventEmitter();
        this.emitter = new NativeEmitter();
        this.quantumBits = new Map();
        this.defaultPackageName = "default";
        this.ignoreGlobal = [];
        this.pendingPromises = [];
        this.emitHMRDependencies = false;
        this.target = "universal";
        this.inlineCSSPath = "css-sourcemaps";
        this.serverBundle = false;
        this.nodeModules = new Map();
        this.libPaths = new Map();
        this.printLogs = true;
        this.runAllMatchedPlugins = false;
        this.useCache = true;
        this.doLog = true;
        this.tsMode = false;
        this.dependents = new Map();
        this.standaloneBundle = true;
        this.sourceMapsProject = false;
        this.sourceMapsVendor = false;
        this.inlineSourceMaps = true;
        this.sourceMapsRoot = "";
        this.initialLoad = true;
        this.debugMode = false;
        this.quantumSplitConfig = new QuantumSplit_1.QuantumSplitConfig(this);
        this.log = new Log_1.Log(this);
        this.natives = {
            process: true,
            stream: true,
            Buffer: true,
            http: true,
        };
        this.autoImportConfig = {};
        this.experimentalAliasEnabled = false;
        this.defer = new Defer_1.Defer();
        this.cacheType = "file";
    }
    initCache() {
        this.cache = new ModuleCache_1.ModuleCache(this);
    }
    resolve() {
        return Promise.all(this.pendingPromises).then(() => {
            this.pendingPromises = [];
        });
    }
    queue(obj) {
        this.pendingPromises.push(obj);
    }
    convertToFuseBoxPath(name) {
        let root = this.homeDir;
        name = name.replace(/\\/g, "/");
        root = root.replace(/\\/g, "/");
        name = name.replace(root, "").replace(/^\/|\\/, "");
        return name;
    }
    isBrowserTarget() {
        return this.target === "browser";
    }
    shouldUseJsNext(libName) {
        if (this.useJsNext === true) {
            return true;
        }
        if (Array.isArray(this.useJsNext)) {
            return this.useJsNext.indexOf(libName) > -1;
        }
    }
    nameSplit(name, filePath) {
        this.quantumSplitConfig.register(name, filePath);
    }
    configureQuantumSplitResolving(opts) {
        this.quantumSplitConfig.resolveOptions = opts;
    }
    setCodeGenerator(fn) {
        this.customCodeGenerator = fn;
    }
    generateCode(ast, opts) {
        if (this.customCodeGenerator) {
            try {
                return this.customCodeGenerator(ast);
            }
            catch (e) { }
        }
        return escodegen.generate(ast, opts);
    }
    replaceAliases(requireStatement) {
        const aliasCollection = this.aliasCollection;
        let replaced = false;
        if (aliasCollection) {
            aliasCollection.forEach(props => {
                if (props.expr.test(requireStatement)) {
                    replaced = true;
                    requireStatement = requireStatement.replace(props.expr, `${props.replacement}$2`);
                }
            });
        }
        return { requireStatement, replaced };
    }
    emitJavascriptHotReload(file) {
        if (file.ignoreCache) {
            return;
        }
        let content = file.contents;
        if (file.context.emitHMRDependencies) {
            this.emitter.addListener("bundle-collected", () => {
                if (file.headerContent) {
                    content = file.headerContent.join("\n") + "\n" + content;
                }
                let dependants = {};
                this.dependents.forEach((set, key) => {
                    dependants[key] = [...set];
                });
                this.sourceChangedEmitter.emit({
                    type: "js",
                    content,
                    dependants: dependants,
                    path: file.info.fuseBoxPath,
                });
            });
        }
        else {
            if (file.headerContent) {
                content = file.headerContent.join("\n") + "\n" + content;
            }
            this.sourceChangedEmitter.emit({
                type: "js",
                content,
                path: file.info.fuseBoxPath,
            });
        }
    }
    debug(group, text) {
        if (this.debugMode) {
            this.log.echo(`${group} : ${text}`);
        }
    }
    nukeCache() {
        this.resetNodeModules();
        this.pendingPromises = [];
        if (this.cache) {
            Utils_1.removeFolder(this.cache.cacheFolder);
            this.cache.initialize();
        }
    }
    setSourceMapsProperty(params) {
        if (typeof params === "boolean") {
            this.sourceMapsProject = params;
        }
        else {
            if (realm_utils_1.utils.isPlainObject(params)) {
                if (params.inlineCSSPath) {
                    this.inlineCSSPath = params.inlineCSSPath;
                }
                this.sourceMapsProject = params.project !== undefined ? params.project : true;
                this.sourceMapsVendor = params.vendor === true;
                if (params.inline !== undefined) {
                    this.inlineSourceMaps = params.inline;
                }
                if (params.sourceRoot || params.sourceRoot === "") {
                    this.sourceMapsRoot = params.sourceRoot;
                }
            }
        }
        if (this.sourceMapsProject || this.sourceMapsVendor) {
            this.useSourceMaps = true;
        }
    }
    warning(str) {
        return this.log.echoWarning(str);
    }
    deprecation(str) {
        setTimeout(() => {
            this.log.echoWarning(str);
        }, 1000);
    }
    fatal(str) {
        throw new Error(str);
    }
    debugPlugin(plugin, text) {
        const name = plugin.constructor && plugin.constructor.name ? plugin.constructor.name : "Unknown";
        this.debug(name, text);
    }
    isShimed(name) {
        if (!this.shim) {
            return false;
        }
        return this.shim[name] !== undefined;
    }
    isHashingRequired() {
        const hashOption = this.hash;
        let useHash = false;
        if (typeof hashOption === "string") {
            if (hashOption !== "md5") {
                throw new Error(`Uknown algorythm ${hashOption}`);
            }
            useHash = true;
        }
        if (hashOption === true) {
            useHash = true;
        }
        return useHash;
    }
    reset() {
        this.log.reset();
        this.cacheBustPreffix = new Date().getTime().toString();
        this.dependents = new Map();
        this.emitter = new NativeEmitter();
        this.storage = new Map();
        this.source = new BundleSource_1.BundleSource(this);
        this.nodeModules = new Map();
        this.pluginTriggers = new Map();
        this.fileGroups = new Map();
        this.libPaths = new Map();
    }
    registerDependant(target, dependant) {
        let fileSet;
        if (!this.dependents.has(target.info.fuseBoxPath)) {
            fileSet = new Set();
            this.dependents.set(target.info.fuseBoxPath, fileSet);
        }
        else {
            fileSet = this.dependents.get(target.info.fuseBoxPath);
        }
        if (!fileSet.has(dependant.info.fuseBoxPath)) {
            fileSet.add(dependant.info.fuseBoxPath);
        }
    }
    initAutoImportConfig(userNatives, userImports) {
        if (this.target !== "server") {
            this.autoImportConfig = AutoImportedModule_1.registerDefaultAutoImportModules(userNatives);
            if (realm_utils_1.utils.isPlainObject(userImports)) {
                for (let varName in userImports) {
                    this.autoImportConfig[varName] = new AutoImportedModule_1.AutoImportedModule(varName, userImports[varName]);
                }
            }
        }
    }
    setItem(key, obj) {
        this.storage.set(key, obj);
    }
    getItem(key, defaultValue) {
        return this.storage.get(key) !== undefined ? this.storage.get(key) : defaultValue;
    }
    setCSSDependencies(file, userDeps) {
        let collection = this.getItem("cssDependencies") || {};
        collection[file.info.absPath] = userDeps;
        this.setItem("cssDependencies", collection);
    }
    extractCSSDependencies(file, opts) {
        const extractor = CSSDependencyExtractor_1.CSSDependencyExtractor.init(opts);
        this.setCSSDependencies(file, extractor.getDependencies());
        return extractor.getDependencies();
    }
    getCSSDependencies(file) {
        let collection = this.getItem("cssDependencies") || {};
        return collection[file.info.absPath];
    }
    createFileGroup(name, collection, handler) {
        let info = {
            fuseBoxPath: name,
            absPath: name,
        };
        let file = new File_1.File(this, info);
        file.collection = collection;
        file.contents = "";
        file.groupMode = true;
        file.groupHandler = handler;
        this.fileGroups.set(name, file);
        return file;
    }
    getFileGroup(name) {
        return this.fileGroups.get(name);
    }
    allowExtension(ext) {
        if (!PathMaster_1.AllowedExtensions.has(ext)) {
            PathMaster_1.AllowedExtensions.add(ext);
        }
    }
    addAlias(obj, value) {
        const aliases = [];
        if (!value) {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (path.isAbsolute(key)) {
                        this.fatal(`Can't use absolute paths with alias "${key}"`);
                    }
                    aliases.push({ expr: new RegExp(`^(${key})(/|$)`), replacement: obj[key] });
                }
            }
        }
        else {
            aliases.push({ expr: new RegExp(`^(${obj})(/|$)`), replacement: value });
        }
        this.aliasCollection = this.aliasCollection || [];
        this.aliasCollection = this.aliasCollection.concat(aliases);
        this.experimentalAliasEnabled = true;
    }
    setHomeDir(dir) {
        this.homeDir = Utils_1.ensureDir(dir);
    }
    setLibInfo(name, version, info) {
        let key = `${name}@${version}`;
        if (!this.libPaths.has(key)) {
            return this.libPaths.set(key, info);
        }
    }
    convert2typescript(name) {
        return name.replace(/\.ts$/, ".js");
    }
    getLibInfo(name, version) {
        let key = `${name}@${version}`;
        if (this.libPaths.has(key)) {
            return this.libPaths.get(key);
        }
    }
    setPrintLogs(printLogs) {
        this.printLogs = printLogs;
    }
    setUseCache(useCache) {
        this.useCache = useCache;
    }
    hasNodeModule(name) {
        return this.nodeModules.has(name);
    }
    isGlobalyIgnored(name) {
        if (this.ignoreGlobal.indexOf(name) > -1) {
            return true;
        }
        if (this.target === "server") {
            return ServerPolyfillList_1.isServerPolyfill(name);
        }
        if (this.target === "electron") {
            return ServerPolyfillList_1.isElectronPolyfill(name);
        }
        return false;
    }
    resetNodeModules() {
        this.nodeModules = new Map();
    }
    addNodeModule(name, collection) {
        this.nodeModules.set(name, collection);
    }
    isFirstTime() {
        return this.initialLoad === true;
    }
    writeOutput(outFileWritten) {
        this.initialLoad = false;
        const res = this.source.getResult();
        if (this.bundle) {
            this.bundle.generatedCode = res.content;
        }
        if (this.output && (!this.bundle || (this.bundle && this.bundle.producer.writeBundles))) {
            this.output.writeCurrent(res.content).then(() => {
                if (this.source.includeSourceMaps) {
                    this.writeSourceMaps(res);
                }
                this.defer.unlock();
                if (realm_utils_1.utils.isFunction(outFileWritten)) {
                    outFileWritten();
                }
            });
        }
        else {
            this.defer.unlock();
            outFileWritten();
        }
    }
    writeSourceMaps(result) {
        if (this.sourceMapsProject || this.sourceMapsVendor) {
            this.output.writeToOutputFolder(`${this.output.filename}.js.map`, result.sourceMap);
        }
    }
    getNodeModule(name) {
        return this.nodeModules.get(name);
    }
    triggerPluginsMethodOnce(name, args, fn) {
        this.plugins.forEach(plugin => {
            if (Array.isArray(plugin)) {
                plugin.forEach(p => {
                    if (realm_utils_1.utils.isFunction(p[name])) {
                        if (this.pluginRequiresTriggering(p, name)) {
                            p[name].apply(p, args);
                            if (fn) {
                                fn(p);
                            }
                        }
                    }
                });
            }
            if (plugin && realm_utils_1.utils.isFunction(plugin[name])) {
                if (this.pluginRequiresTriggering(plugin, name)) {
                    plugin[name].apply(plugin, args);
                    if (fn) {
                        fn(plugin);
                    }
                }
            }
        });
    }
    pluginRequiresTriggering(cls, method) {
        if (!cls.constructor) {
            return true;
        }
        let name = cls.constructor.name;
        if (!this.pluginTriggers.has(name)) {
            this.pluginTriggers.set(name, new Set());
        }
        let items = this.pluginTriggers.get(name);
        if (!items.has(method)) {
            items.add(method);
            return true;
        }
        return false;
    }
}
exports.WorkFlowContext = WorkFlowContext;
