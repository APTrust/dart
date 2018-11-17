"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VueBlockFile_1 = require("./VueBlockFile");
class VueScriptFile extends VueBlockFile_1.VueBlockFile {
    async process() {
        const typescriptTranspiler = require("typescript");
        this.loadContents();
        if (this.pluginChain.length > 1) {
            const message = "VueComponentClass - only one script transpiler can be used in the plugin chain";
            this.context.log.echoError(message);
            return Promise.reject(new Error(message));
        }
        if (this.pluginChain[0] === null) {
            const cnt = this.file.replaceDynamicImports(this.contents.trim());
            const transpiled = typescriptTranspiler.transpileModule(cnt, this.context.tsConfig.getConfig());
            if (this.context.useSourceMaps && transpiled.sourceMapText) {
                const jsonSourceMaps = JSON.parse(transpiled.sourceMapText);
                jsonSourceMaps.sources = [this.context.sourceMapsRoot + "/" + this.relativePath.replace(/\.js(x?)$/, ".ts$1")];
                this.sourceMap = JSON.stringify(jsonSourceMaps);
            }
            this.contents = transpiled.outputText;
            this.context.debug("VueComponentClass", `using TypeScript for ${this.info.fuseBoxPath}`);
            return Promise.resolve();
        }
        this.pluginChain[0].init(this.context);
        this.collection = { name: "default" };
        return this.pluginChain[0].transform(this);
    }
}
exports.VueScriptFile = VueScriptFile;
