"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Utils_1 = require("../../Utils");
const File_1 = require("../../core/File");
const CSSplugin_1 = require("../stylesheet/CSSplugin");
const LESSPlugin_1 = require("../stylesheet/LESSPlugin");
const SassPlugin_1 = require("../stylesheet/SassPlugin");
const StylusPlugin_1 = require("../stylesheet/StylusPlugin");
const HTMLplugin_1 = require("../HTMLplugin");
const BabelPlugin_1 = require("../js-transpilers/BabelPlugin");
const CoffeePlugin_1 = require("../js-transpilers/CoffeePlugin");
const ConsolidatePlugin_1 = require("../ConsolidatePlugin");
const PLUGIN_LANG_MAP = new Map()
    .set("css", new CSSplugin_1.CSSPluginClass())
    .set("less", new LESSPlugin_1.LESSPluginClass())
    .set("scss", new SassPlugin_1.SassPluginClass({ importer: true }))
    .set("sass", new SassPlugin_1.SassPluginClass({ importer: true, indentedSyntax: true }))
    .set("styl", new StylusPlugin_1.StylusPluginClass())
    .set("stylus", new StylusPlugin_1.StylusPluginClass())
    .set("html", new HTMLplugin_1.FuseBoxHTMLPlugin())
    .set("js", new BabelPlugin_1.BabelPluginClass())
    .set("ts", null)
    .set("coffee", new CoffeePlugin_1.CoffeePluginClass());
class VueBlockFile extends File_1.File {
    constructor(file, info, block, scopeId, pluginChain) {
        super(file.context, info);
        this.file = file;
        this.info = info;
        this.block = block;
        this.scopeId = scopeId;
        this.pluginChain = pluginChain;
        this.collection = file.collection;
        this.context.extensionOverrides && this.context.extensionOverrides.setOverrideFileInfo(this);
        this.ignoreCache = true;
    }
    setPluginChain(block, pluginChain) {
        const defaultExtension = Utils_1.extractExtension(this.info.fuseBoxPath);
        if (pluginChain.length === 0 && !block.lang) {
            if (defaultExtension === "js" && this.context.useTypescriptCompiler) {
                pluginChain.push(PLUGIN_LANG_MAP.get("ts"));
            }
            else if (block.type === "template" && Utils_1.extractExtension(this.info.absPath) !== "html") {
                pluginChain.push(new ConsolidatePlugin_1.ConsolidatePluginClass({
                    engine: Utils_1.extractExtension(this.info.absPath),
                }));
            }
            else {
                pluginChain.push(PLUGIN_LANG_MAP.get(defaultExtension));
            }
        }
        if (pluginChain.length === 0 && block.lang) {
            if ((defaultExtension === "js" && this.context.useTypescriptCompiler) || block.lang === "ts") {
                pluginChain.push(PLUGIN_LANG_MAP.get("ts"));
            }
            else {
                const PluginToUse = PLUGIN_LANG_MAP.get(block.lang.toLowerCase());
                if (!PluginToUse) {
                    if (block.type === "template") {
                        pluginChain.push(new ConsolidatePlugin_1.ConsolidatePluginClass({
                            engine: block.lang.toLowerCase(),
                        }));
                    }
                    else {
                        const message = `VueComponentClass - cannot find a plugin to transpile lang="${block.lang}"`;
                        this.context.log.echoError(message);
                        return Promise.reject(new Error(message));
                    }
                }
                else {
                    pluginChain.push(PluginToUse);
                }
                if (block.type === "style" && !(PluginToUse instanceof CSSplugin_1.CSSPluginClass)) {
                    pluginChain.push(PLUGIN_LANG_MAP.get("css"));
                }
            }
        }
        const pluginChainString = this.pluginChain
            .map(plugin => {
            return plugin ? plugin.constructor.name : "TypeScriptCompiler";
        })
            .join(" → ");
        this.context.debug("VueComponentClass", `using ${pluginChainString} for ${this.info.fuseBoxPath}`);
    }
    loadContents() {
        if (this.isLoaded) {
            return;
        }
        if (this.block.src || this.hasExtensionOverride) {
            try {
                this.contents = fs.readFileSync(this.info.absPath).toString();
            }
            catch (e) {
                this.context.log.echoError(`VueComponentPlugin - Could not load external file ${this.info.absPath}`);
            }
        }
        else {
            this.contents = this.block.content;
        }
        this.isLoaded = true;
    }
}
exports.VueBlockFile = VueBlockFile;
