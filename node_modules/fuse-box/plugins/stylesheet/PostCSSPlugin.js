"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let postcss;
class PostCSSPluginClass {
    constructor(processors = [], options = {}) {
        this.processors = processors;
        this.options = options;
        this.test = /\.p?css$/;
        this.dependencies = [];
    }
    init(context) {
        context.allowExtension(".css");
        context.allowExtension(".pcss");
    }
    transform(file) {
        file.addStringDependency("fuse-box-css");
        if (file.isCSSCached("postcss")) {
            return;
        }
        file.bustCSSCache = true;
        file.loadContents();
        const { sourceMaps = true, ...postCssOptions } = this.options;
        const paths = [file.info.absDir, ...(this.options.paths || [])];
        const cssDependencies = file.context.extractCSSDependencies(file, {
            paths: paths,
            content: file.contents,
            extensions: ["css", "pcss"],
        });
        file.cssDependencies = cssDependencies;
        if (!postcss) {
            postcss = require("postcss");
        }
        postCssOptions.map = file.context.useSourceMaps ? { inline: false } : false;
        let fromFile = file.getCorrectSourceMapPath();
        if (fromFile.charAt(0) === "/") {
            fromFile = fromFile.slice(1);
        }
        postCssOptions.from = postCssOptions.from || file.info.absPath;
        postCssOptions.to = postCssOptions.to || fromFile;
        return postcss(this.processors)
            .process(file.contents, postCssOptions)
            .then(result => {
            file.contents = result.css;
            file.sourceMap = result.map ? result.map.toString() : undefined;
            if (file.context.useCache) {
                file.analysis.dependencies = cssDependencies;
                file.context.cache.writeStaticCache(file, file.sourceMap, "postcss");
                file.analysis.dependencies = [];
            }
            return result.css;
        });
    }
}
exports.PostCSSPluginClass = PostCSSPluginClass;
function PostCSS(processors, opts) {
    if (Array.isArray(processors)) {
        const options = extractPlugins(opts);
        return new PostCSSPluginClass(processors.concat(options.plugins), options.postCssOptions);
    }
    const options = extractPlugins(processors);
    return new PostCSSPluginClass(options.plugins, options.postCssOptions);
}
exports.PostCSS = PostCSS;
function extractPlugins(opts) {
    const { plugins = [], ...otherOptions } = opts || {};
    if (plugins.length > 0) {
        console.warn(`The postcss "plugin" option is deprecated. Please use PostCssPlugin(plugins, options) instead.`);
    }
    return {
        plugins,
        postCssOptions: otherOptions,
    };
}
