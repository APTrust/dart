"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const Utils_1 = require("../../Utils");
let babelCore;
class BabelPluginClass {
    constructor(opts = {}) {
        this.extensions = [".jsx"];
        this.test = /\.(j|t)s(x)?$/;
        this.limit2project = true;
        this.config = {};
        this.configPrinted = false;
        this.configLoaded = false;
        if (opts.config === undefined &&
            opts.test === undefined &&
            opts.limit2project === undefined &&
            opts.extensions === undefined &&
            Object.keys(opts).length) {
            this.config = opts;
            return;
        }
        if (opts.config) {
            this.config = opts.config;
        }
        if (opts.extensions !== undefined) {
            this.extensions = opts.extensions;
            if (opts.test === undefined) {
                this.test = Utils_1.string2RegExp(opts.extensions.join("|"));
            }
        }
        if (opts.test !== undefined) {
            this.test = opts.test;
        }
        if (opts.limit2project !== undefined) {
            this.limit2project = opts.limit2project;
        }
    }
    handleBabelRc() {
        if (this.configLoaded)
            return;
        let babelRcConfig;
        let babelRcPath = path.join(this.context.appRoot, `.babelrc`);
        if (fs.existsSync(babelRcPath)) {
            babelRcConfig = fs.readFileSync(babelRcPath).toString();
            if (babelRcConfig) {
                babelRcConfig = Object.assign({}, JSON.parse(babelRcConfig), this.config);
            }
        }
        if (babelRcConfig) {
            this.config = babelRcConfig;
        }
        this.configLoaded = true;
    }
    init(context) {
        this.context = context;
        if (Array.isArray(this.extensions)) {
            this.extensions.forEach(ext => context.allowExtension(ext));
        }
        this.handleBabelRc();
    }
    transform(file, ast) {
        file.wasTranspiled = true;
        if (!babelCore) {
            babelCore = require("babel-core");
        }
        if (this.configPrinted === false && this.context.doLog === true) {
            file.context.debug("BabelPlugin", `\n\tConfiguration: ${JSON.stringify(this.config)}`);
            this.configPrinted = true;
        }
        if (this.context.useCache) {
            if (file.loadFromCache()) {
                return;
            }
        }
        file.loadContents();
        if (this.limit2project === false || file.collection.name === file.context.defaultPackageName) {
            let result;
            try {
                result = babelCore.transform(file.contents, this.config);
            }
            catch (e) {
                file.analysis.skip();
                console.error(e);
                return;
            }
            if (result.ast) {
                file.analysis.loadAst(result.ast);
                let sourceMaps = result.map;
                file.context.setCodeGenerator(ast => {
                    const result = babelCore.transformFromAst(ast);
                    sourceMaps = result.map;
                    return result.code;
                });
                file.contents = result.code;
                file.analysis.analyze();
                if (sourceMaps) {
                    sourceMaps.file = file.info.fuseBoxPath;
                    sourceMaps.sources = [file.context.sourceMapsRoot + "/" + file.info.fuseBoxPath];
                    if (!file.context.inlineSourceMaps) {
                        delete sourceMaps.sourcesContent;
                    }
                    file.sourceMap = JSON.stringify(sourceMaps);
                }
                if (this.context.useCache) {
                    this.context.emitJavascriptHotReload(file);
                    this.context.cache.writeStaticCache(file, file.sourceMap);
                }
            }
        }
    }
}
exports.BabelPluginClass = BabelPluginClass;
exports.BabelPlugin = (opts = {}) => {
    return new BabelPluginClass(opts);
};
