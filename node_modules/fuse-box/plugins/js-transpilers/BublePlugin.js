"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let bubleCore;
class BublePluginClass {
    constructor(config) {
        this.test = /\.(j|t)s(x)?$/;
        this.config = {};
        this.configPrinted = false;
        this.config = config || {};
        if (config.test !== undefined) {
            this.test = config.test;
            delete config.test;
        }
    }
    init(context) {
        this.context = context;
        context.allowExtension(".jsx");
    }
    transform(file, ast) {
        if (!bubleCore) {
            bubleCore = require("buble");
        }
        if (this.configPrinted === false && this.context.doLog === true) {
            file.context.debug("BublePlugin", `\n\tConfiguration: ${JSON.stringify(this.config)}`);
            this.configPrinted = true;
        }
        if (this.context.useCache) {
            if (file.loadFromCache()) {
                return;
            }
        }
        let result;
        try {
            const config = {
                ...this.config,
                output: file.info.fuseBoxPath,
                source: file.info.absPath,
            };
            result = bubleCore.transform(file.contents, config);
        }
        catch (e) {
            file.analysis.skip();
            console.error(e);
            return;
        }
        if (result.ast) {
            file.analysis.loadAst(result.ast);
            let sourceMaps = result.map;
            file.contents = result.code;
            file.analysis.analyze();
            if (sourceMaps) {
                sourceMaps.file = file.info.fuseBoxPath;
                sourceMaps.sources = [file.info.fuseBoxPath];
                file.sourceMap = JSON.stringify(sourceMaps);
            }
            if (this.context.useCache) {
                this.context.emitJavascriptHotReload(file);
                this.context.cache.writeStaticCache(file, file.sourceMap);
            }
        }
    }
}
exports.BublePluginClass = BublePluginClass;
exports.BublePlugin = (opts) => {
    return new BublePluginClass(opts);
};
