"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let stylus;
class StylusPluginClass {
    constructor(options = {}) {
        this.options = options;
        this.test = /\.styl$/;
    }
    init(context) {
        context.allowExtension(".styl");
    }
    transform(file) {
        file.addStringDependency("fuse-box-css");
        if (file.isCSSCached("styl")) {
            return;
        }
        file.bustCSSCache = true;
        const context = file.context;
        const options = { ...this.options };
        const sourceMapDef = {
            comment: false,
            sourceRoot: file.info.absDir,
        };
        file.loadContents();
        if (!stylus)
            stylus = require("stylus");
        options.filename = file.info.fuseBoxPath;
        if (!options.paths) {
            options.paths = [];
        }
        options.paths.push(file.info.absDir);
        if ("sourceMapConfig" in context) {
            options.sourcemap = { ...sourceMapDef, ...(this.options.sourcemap || {}) };
        }
        const cssDependencies = file.context.extractCSSDependencies(file, {
            paths: options.paths,
            content: file.contents,
            sassStyle: true,
            extensions: ["styl", "css"],
        });
        file.cssDependencies = cssDependencies;
        return new Promise((res, rej) => {
            const renderer = stylus(file.contents, options);
            return renderer.render((err, css) => {
                if (err)
                    return rej(err);
                if (renderer.sourcemap) {
                    file.sourceMap = JSON.stringify(renderer.sourcemap);
                }
                file.contents = css;
                if (context.useCache) {
                    file.analysis.dependencies = cssDependencies;
                    context.cache.writeStaticCache(file, file.sourceMap, "styl");
                    file.analysis.dependencies = [];
                }
                return res(css);
            });
        });
    }
}
exports.StylusPluginClass = StylusPluginClass;
exports.StylusPlugin = (options) => {
    return new StylusPluginClass(options);
};
