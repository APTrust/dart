"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postcss = require("postcss");
const log = require("fliplog");
class CSSModulesClass {
    constructor(options = {}) {
        this.test = /\.css$/;
        this.useDefault = true;
        this.options = options;
        if (this.options.useDefault !== undefined) {
            this.useDefault = this.options.useDefault;
        }
        if (this.options.scopedName !== undefined) {
            this.scopedName = this.options.scopedName;
        }
    }
    init(context) {
        context.allowExtension(".css");
    }
    transform(file) {
        file.addStringDependency("fuse-box-css");
        if (file.isCSSCached("cssmodules")) {
            return;
        }
        file.bustCSSCache = true;
        return new Promise((resolve, reject) => {
            file.loadContents();
            const context = file.context;
            const paths = [file.info.absDir, ...(this.options.paths || [])];
            const cssDependencies = context.extractCSSDependencies(file, {
                paths,
                content: file.contents,
                extensions: ["css"],
            });
            file.cssDependencies = cssDependencies;
            return postcss([
                require("postcss-modules")({
                    root: this.options.root || file.info.absDir,
                    getJSON: (cssFileName, json) => {
                        const exportsKey = this.useDefault ? "module.exports.default" : "module.exports";
                        const cnt = [];
                        if (this.useDefault) {
                            cnt.push(`Object.defineProperty(exports, "__esModule", { value: true });`);
                        }
                        cnt.push(`${exportsKey} = ${JSON.stringify(json)};`);
                        file.addAlternativeContent(cnt.join("\n"));
                    },
                    generateScopedName: this.scopedName ? this.scopedName : "_[local]___[hash:base64:5]",
                }),
            ])
                .process(file.contents, { from: file.absPath })
                .then(result => {
                file.contents = result.css;
                if (context.useCache) {
                    file.analysis.dependencies = cssDependencies;
                    context.cache.writeStaticCache(file, file.sourceMap, "cssmodules");
                    file.analysis.dependencies = [];
                }
                return resolve();
            });
        });
    }
}
exports.CSSModulesClass = CSSModulesClass;
exports.CSSModulesPlugin = (options) => new CSSModulesClass(options);
exports.CSSModules = options => {
    log
        .preset("warning")
        .data("CSSModulesPlugin deprecation notice: please rename your CSSModules imports to CSSModulesPlugin")
        .echo();
    return exports.CSSModulesPlugin(options);
};
