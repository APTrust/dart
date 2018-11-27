"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VueBlockFile_1 = require("./VueBlockFile");
const CSSplugin_1 = require("../stylesheet/CSSplugin");
const PostCSSPlugins_1 = require("./PostCSSPlugins");
class VueStyleFile extends VueBlockFile_1.VueBlockFile {
    fixSourceMapName() {
        if (this.context.useSourceMaps && this.sourceMap) {
            const jsonSourceMaps = JSON.parse(this.sourceMap);
            jsonSourceMaps.sources = jsonSourceMaps.sources.map(source => {
                const fileName = source.substr(source.lastIndexOf("/") + 1);
                const dirPath = this.relativePath.substr(0, this.relativePath.lastIndexOf("/") + 1);
                return `${dirPath}${fileName}`;
            });
            this.sourceMap = JSON.stringify(jsonSourceMaps);
        }
    }
    async applyScopeIdToStyles(scopeId) {
        const postcss = require("postcss");
        const plugins = [PostCSSPlugins_1.TrimPlugin(), PostCSSPlugins_1.AddScopeIdPlugin({ id: scopeId })];
        return postcss(plugins)
            .process(this.contents, {
            map: false,
            from: this.file.info.absPath,
        })
            .then(result => {
            this.contents = result.css;
        });
    }
    async process() {
        this.loadContents();
        if (!this.contents) {
            return Promise.resolve();
        }
        const pluginChainString = this.pluginChain.map(plugin => plugin.constructor.name).join(" → ");
        this.context.debug("VueComponentClass", `using ${pluginChainString} for ${this.info.fuseBoxPath}`);
        return this.pluginChain
            .reduce((chain, plugin) => {
            return chain
                .then(() => {
                if (plugin instanceof CSSplugin_1.CSSPluginClass && this.block.scoped) {
                    return this.applyScopeIdToStyles(this.scopeId);
                }
                return Promise.resolve();
            })
                .then(() => {
                const promise = plugin.transform(this);
                return promise || Promise.resolve();
            });
        }, Promise.resolve(this))
            .then(() => {
            this.fixSourceMapName();
            return Promise.resolve();
        });
    }
}
exports.VueStyleFile = VueStyleFile;
