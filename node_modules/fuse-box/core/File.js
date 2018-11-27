"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FileAnalysis_1 = require("../analysis/FileAnalysis");
const SourceMapGenerator_1 = require("./SourceMapGenerator");
const realm_utils_1 = require("realm-utils");
const fs = require("fs");
const path = require("path");
const Utils_1 = require("../Utils");
var ScriptTarget;
(function (ScriptTarget) {
    ScriptTarget[ScriptTarget["ES5"] = 1] = "ES5";
    ScriptTarget[ScriptTarget["ES2015"] = 2] = "ES2015";
    ScriptTarget[ScriptTarget["ES6"] = 2] = "ES6";
    ScriptTarget[ScriptTarget["ES2016"] = 3] = "ES2016";
    ScriptTarget[ScriptTarget["ES7"] = 3] = "ES7";
    ScriptTarget[ScriptTarget["ES2017"] = 4] = "ES2017";
    ScriptTarget[ScriptTarget["ESNext"] = 5] = "ESNext";
})(ScriptTarget = exports.ScriptTarget || (exports.ScriptTarget = {}));
class File {
    constructor(context, info) {
        this.context = context;
        this.info = info;
        this.isFuseBoxBundle = false;
        this.languageLevel = ScriptTarget.ES5;
        this.es6module = false;
        this.dependants = new Set();
        this.dependencies = new Set();
        this.shouldIgnoreDeps = false;
        this.resolveDepsOnly = false;
        this.wasTranspiled = false;
        this.cached = false;
        this.isLoaded = false;
        this.ignoreCache = false;
        this.isNodeModuleEntry = false;
        this.isTypeScript = false;
        this.properties = new Map();
        this.analysis = new FileAnalysis_1.FileAnalysis(this);
        this.resolving = [];
        this.subFiles = [];
        this.groupMode = false;
        this.hasExtensionOverride = false;
        this.bustCSSCache = false;
        if (info.params) {
            this.params = info.params;
        }
        this.absPath = info.absPath;
        if (this.absPath) {
            this.relativePath = Utils_1.ensureFuseBoxPath(path.relative(this.context.appRoot, this.absPath));
        }
    }
    addAlternativeContent(str) {
        this.alternativeContent = this.alternativeContent || "";
        this.alternativeContent += "\n" + str;
    }
    registerDependant(file) {
        if (!this.dependants.has(file.info.fuseBoxPath)) {
            this.dependants.add(file.info.fuseBoxPath);
        }
    }
    registerDependency(file) {
        if (!this.dependencies.has(file.info.fuseBoxPath)) {
            this.dependencies.add(file.info.fuseBoxPath);
        }
    }
    static createByName(collection, name) {
        let info = {
            fuseBoxPath: name,
            absPath: name,
        };
        let file = new File(collection.context, info);
        file.collection = collection;
        return file;
    }
    static createModuleReference(collection, packageInfo) {
        let info = {
            fuseBoxPath: name,
            absPath: name,
            isNodeModule: true,
            nodeModuleInfo: packageInfo,
        };
        let file = new File(collection.context, info);
        file.collection = collection;
        return file;
    }
    setLanguageLevel(level) {
        if (this.languageLevel < level) {
            this.languageLevel = level;
        }
    }
    addProperty(key, obj) {
        this.properties.set(key, obj);
    }
    addStringDependency(name) {
        let deps = this.analysis.dependencies;
        if (deps.indexOf(name) === -1) {
            deps.push(name);
        }
    }
    getProperty(key) {
        return this.properties.get(key);
    }
    hasSubFiles() {
        return this.subFiles.length > 0;
    }
    addSubFile(file) {
        this.subFiles.push(file);
    }
    getUniquePath() {
        let collection = this.collection ? this.collection.name : "default";
        return `${collection}/${this.info.fuseBoxPath}`;
    }
    getCrossPlatormPath() {
        let name = this.absPath;
        if (!name) {
            return;
        }
        name = name.replace(/\\/g, "/");
        return name;
    }
    tryTypescriptPlugins() {
        if (this.context.plugins) {
            this.context.plugins.forEach((plugin) => {
                if (plugin && realm_utils_1.utils.isFunction(plugin.onTypescriptTransform)) {
                    plugin.onTypescriptTransform(this);
                }
            });
        }
    }
    tryPlugins(_ast) {
        if (this.context.runAllMatchedPlugins) {
            return this.tryAllPlugins(_ast);
        }
        if (this.context.plugins && this.relativePath) {
            let target;
            let index = 0;
            while (!target && index < this.context.plugins.length) {
                let item = this.context.plugins[index];
                let itemTest;
                if (Array.isArray(item)) {
                    let el = item[0];
                    if (el && typeof el.test === "function") {
                        itemTest = el;
                    }
                    else {
                        itemTest = el.test;
                    }
                }
                else {
                    itemTest = item && item.test;
                }
                if (itemTest && realm_utils_1.utils.isFunction(itemTest.test) && itemTest.test(this.relativePath)) {
                    target = item;
                }
                index++;
            }
            const tasks = [];
            if (target) {
                if (Array.isArray(target)) {
                    target.forEach(plugin => {
                        if (realm_utils_1.utils.isFunction(plugin.transform)) {
                            this.context.debugPlugin(plugin, `Captured ${this.info.fuseBoxPath}`);
                            tasks.push(() => plugin.transform.apply(plugin, [this]));
                        }
                    });
                }
                else {
                    if (realm_utils_1.utils.isFunction(target.transform)) {
                        this.context.debugPlugin(target, `Captured ${this.info.fuseBoxPath}`);
                        tasks.push(() => target.transform.apply(target, [this]));
                    }
                }
            }
            const promise = realm_utils_1.each(tasks, promise => promise());
            this.context.queue(promise);
            return promise;
        }
    }
    async tryAllPlugins(_ast) {
        const tasks = [];
        if (this.context.plugins && this.relativePath) {
            const addTask = item => {
                if (realm_utils_1.utils.isFunction(item.transform)) {
                    this.context.debugPlugin(item, `Captured ${this.info.fuseBoxPath}`);
                    tasks.push(() => item.transform.apply(item, [this]));
                }
            };
            this.context.plugins.forEach(item => {
                let itemTest;
                if (Array.isArray(item)) {
                    let el = item[0];
                    itemTest = el && realm_utils_1.utils.isFunction(el.test) ? el : el.test;
                }
                else {
                    itemTest = item && item.test;
                }
                if (itemTest && realm_utils_1.utils.isFunction(itemTest.test) && itemTest.test(this.relativePath)) {
                    Array.isArray(item) ? item.forEach(addTask, this) : addTask(item);
                }
            }, this);
        }
        const promise = realm_utils_1.each(tasks, promise => promise());
        this.context.queue(promise);
        return promise;
    }
    addHeaderContent(str) {
        if (!this.headerContent) {
            this.headerContent = [];
        }
        this.headerContent.push(str);
    }
    loadContents() {
        if (this.isLoaded) {
            return;
        }
        this.contents = fs.readFileSync(this.info.absPath).toString();
        this.isLoaded = true;
    }
    makeAnalysis(parserOptions, traversalOptions) {
        if (!this.analysis.astIsLoaded()) {
            this.analysis.parseUsingAcorn(parserOptions);
        }
        this.analysis.analyze(traversalOptions);
    }
    replaceDynamicImports(localContent) {
        if (!this.context.dynamicImportsEnabled) {
            return;
        }
        let targetContent = localContent || this.contents;
        if (targetContent) {
            const expression = /(\s+|^|\(|:)(import\()/g;
            if (expression.test(targetContent)) {
                targetContent = targetContent.replace(expression, "$1$fsmp$(");
                if (this.context.fuse && this.context.fuse.producer) {
                    this.devLibsRequired = ["fuse-imports"];
                    if (!this.context.fuse.producer.devCodeHasBeenInjected("fuse-imports")) {
                        this.context.fuse.producer.injectDevCode("fuse-imports", Utils_1.readFuseBoxModule("fuse-box-responsive-api/dev-imports.js"));
                    }
                }
            }
            if (!localContent) {
                this.contents = targetContent;
            }
        }
        return targetContent;
    }
    belongsToProject() {
        return this.collection && this.collection.name === this.context.defaultPackageName;
    }
    consume() {
        if (this.info.isRemoteFile) {
            return;
        }
        if (!this.absPath) {
            return;
        }
        this.context.extensionOverrides && this.context.extensionOverrides.setOverrideFileInfo(this);
        if (!fs.existsSync(this.info.absPath)) {
            if (!/\*/.test(this.info.fuseBoxPath)) {
                if (/\.js(x)?$/.test(this.info.fuseBoxPath) && this.context.fuse && this.context.fuse.producer) {
                    this.context.fuse.producer.addWarning("unresolved", `Statement "${this.info.fuseBoxPath}" has failed to resolve in module "${this.collection &&
                        this.collection.name}"`);
                }
                else {
                    this.addError(`Asset reference "${this.info.fuseBoxPath}" has failed to resolve in module "${this.collection &&
                        this.collection.name}"`);
                }
            }
            this.notFound = true;
            return;
        }
        if (/\.ts(x)?$/.test(this.absPath)) {
            this.context.debug("Typescript", `Captured  ${this.info.fuseBoxPath}`);
            return this.handleTypescript();
        }
        if (/\.js(x)?$/.test(this.absPath)) {
            this.loadContents();
            this.replaceDynamicImports();
            if (this.context.useTypescriptCompiler && this.belongsToProject()) {
                return this.handleTypescript();
            }
            this.tryPlugins();
            if (!this.wasTranspiled && this.context.cache && this.belongsToProject()) {
                if (this.loadFromCache()) {
                    return;
                }
                this.makeAnalysis();
                if (this.context.useCache) {
                    this.context.cache.writeStaticCache(this, this.sourceMap);
                }
                return;
            }
            const vendorSourceMaps = this.context.sourceMapsVendor && !this.belongsToProject();
            if (vendorSourceMaps) {
                this.loadVendorSourceMap();
            }
            else {
                this.makeAnalysis();
            }
            return;
        }
        return this.tryPlugins().then(result => {
            if (!this.isLoaded) {
                this.contents = "";
                this.context.fuse.producer.addWarning("missing-plugin", `The contents of ${this.absPath} weren't loaded. Missing a plugin?`);
            }
            return result;
        });
    }
    fileDependsOnLastChangedCSS() {
        const bundle = this.context.bundle;
        if (bundle && bundle.lastChangedFile) {
            if (!Utils_1.isStylesheetExtension(bundle.lastChangedFile)) {
                return false;
            }
            let collection = this.context.getItem("cssDependencies");
            if (!collection) {
                return false;
            }
            if (!collection[this.info.absPath]) {
                return false;
            }
            let HMR_FILE_REQUIRED = this.context.getItem("HMR_FILE_REQUIRED", []);
            for (let i = 0; i < collection[this.info.absPath].length; i++) {
                const absPath = Utils_1.ensureFuseBoxPath(collection[this.info.absPath][i]);
                if (absPath.indexOf(bundle.lastChangedFile) > -1) {
                    this.context.log.echoInfo(`CSS Dependency: ${bundle.lastChangedFile} depends on ${this.info.fuseBoxPath}`);
                    HMR_FILE_REQUIRED.push(this.info.fuseBoxPath);
                    this.context.setItem("HMR_FILE_REQUIRED", HMR_FILE_REQUIRED);
                    return true;
                }
            }
        }
    }
    isCSSCached(type = "css") {
        if (this.ignoreCache === true || this.bustCSSCache) {
            return false;
        }
        if (!this.context || !this.context.cache) {
            return;
        }
        if (!this.context.useCache) {
            return false;
        }
        let cached = this.context.cache.getStaticCache(this, type);
        if (cached) {
            if (cached.sourceMap) {
                this.sourceMap = cached.sourceMap;
            }
            if (cached.ac) {
                this.alternativeContent = cached.ac;
            }
            this.context.setCSSDependencies(this, cached.dependencies);
            if (!this.fileDependsOnLastChangedCSS()) {
                this.isLoaded = true;
                this.contents = cached.contents;
                return true;
            }
        }
        return false;
    }
    loadFromCache() {
        let cached = this.context.cache.getStaticCache(this);
        if (cached) {
            if (cached.sourceMap) {
                this.sourceMap = cached.sourceMap;
            }
            this.isLoaded = true;
            this.cached = true;
            if (cached._) {
                this.cacheData = cached._;
            }
            if (cached.ac) {
                this.alternativeContent = cached.ac;
            }
            if (cached.devLibsRequired) {
                cached.devLibsRequired.forEach(item => {
                    if (!this.context.fuse.producer.devCodeHasBeenInjected(item)) {
                        this.context.fuse.producer.injectDevCode(item, Utils_1.readFuseBoxModule("fuse-box-responsive-api/dev-imports.js"));
                    }
                });
            }
            if (cached.headerContent) {
                this.headerContent = cached.headerContent;
            }
            this.analysis.skip();
            this.analysis.dependencies = cached.dependencies;
            this.contents = cached.contents;
            return true;
        }
        return false;
    }
    loadVendorSourceMap() {
        if (!this.context.cache) {
            return this.makeAnalysis();
        }
        const key = `vendor/${this.collection.name}/${this.info.fuseBoxPath}`;
        this.context.debug("File", `Vendor sourcemap ${key}`);
        let cachedMaps = this.context.cache.getPermanentCache(key);
        if (cachedMaps) {
            this.sourceMap = cachedMaps;
            this.makeAnalysis();
        }
        else {
            const tokens = [];
            this.makeAnalysis({ onToken: tokens });
            SourceMapGenerator_1.SourceMapGenerator.generate(this, tokens);
            this.generateCorrectSourceMap(key);
            this.context.cache.setPermanentCache(key, this.sourceMap);
        }
    }
    transpileUsingTypescript() {
        try {
            const ts = require("typescript");
            try {
                return ts.transpileModule(this.contents, this.getTranspilationConfig());
            }
            catch (e) {
                this.context.fatal(`${this.info.absPath}: ${e}`);
                return;
            }
        }
        catch (e) {
            this.context.fatal(`TypeScript automatic transpilation has failed. Please check that:
            - You have TypeScript installed
            - Your tsconfig.json file is not malformed.\nError message: ${e.message}`);
            return;
        }
    }
    generateInlinedCSS() {
        const re = /(\/*#\s*sourceMappingURL=\s*)([^\s]+)(\s*\*\/)/g;
        const newName = Utils_1.joinFuseBoxPath("/", this.context.inlineCSSPath, `${Utils_1.fastHash(this.info.fuseBoxPath)}.map`);
        this.contents = this.contents.replace(re, `$1${newName}$3`);
        this.context.output.writeToOutputFolder(newName, this.sourceMap);
        if (this.context.fuse && this.context.fuse.producer) {
            const producer = this.context.fuse.producer;
            const fullName = `${this.collection.name || "default"}/${this.info.fuseBoxPath}`;
            producer.sharedSourceMaps.set(fullName, this.sourceMap);
        }
    }
    getCorrectSourceMapPath() {
        return this.context.sourceMapsRoot + "/" + this.relativePath;
    }
    handleTypescript() {
        this.wasTranspiled = true;
        if (this.context.useCache) {
            if (this.loadFromCache()) {
                this.tryPlugins();
                return;
            }
        }
        this.loadContents();
        this.replaceDynamicImports();
        this.tryTypescriptPlugins();
        this.context.debug("TypeScript", `Transpile ${this.info.fuseBoxPath}`);
        let result = this.transpileUsingTypescript();
        if (result.sourceMapText && this.context.useSourceMaps) {
            const correctSourceMapPath = this.getCorrectSourceMapPath();
            let jsonSourceMaps = JSON.parse(result.sourceMapText);
            jsonSourceMaps.file = this.info.fuseBoxPath;
            jsonSourceMaps.sources = [
                this.context.useTypescriptCompiler ? correctSourceMapPath : correctSourceMapPath.replace(/\.js(x?)$/, ".ts$1"),
            ];
            if (!this.context.inlineSourceMaps) {
                delete jsonSourceMaps.sourcesContent;
            }
            result.outputText = result.outputText
                .replace(`//# sourceMappingURL=${this.info.fuseBoxPath}.map`, `//# sourceMappingURL=${this.context.bundle.name}.js.map?tm=${this.context.cacheBustPreffix}`)
                .replace("//# sourceMappingURL=module.js.map", "");
            this.sourceMap = JSON.stringify(jsonSourceMaps);
        }
        this.contents = result.outputText;
        this.makeAnalysis();
        this.tryPlugins();
        if (this.context.useCache) {
            this.context.emitJavascriptHotReload(this);
            this.context.cache.writeStaticCache(this, this.sourceMap);
        }
    }
    setCacheData(data) {
        this.cacheData = data;
    }
    generateCorrectSourceMap(fname) {
        if (typeof this.sourceMap === "string") {
            let jsonSourceMaps = JSON.parse(this.sourceMap);
            jsonSourceMaps.file = this.info.fuseBoxPath;
            jsonSourceMaps.sources = jsonSourceMaps.sources.map((source) => {
                return this.context.sourceMapsRoot + "/" + (fname || source);
            });
            if (!this.context.inlineSourceMaps) {
                delete jsonSourceMaps.sourcesContent;
            }
            this.sourceMap = JSON.stringify(jsonSourceMaps);
        }
        return this.sourceMap;
    }
    getTranspilationConfig() {
        return Object.assign({}, this.context.tsConfig.getConfig(), {
            fileName: this.info.absPath,
            transformers: this.context.fuse.opts.transformers || {},
        });
    }
    addError(message) {
        this.context.bundle.addError(message);
    }
}
exports.File = File;
