"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Config_1 = require("../../Config");
const Utils_1 = require("../../Utils");
let sass;
class SassPluginClass {
    constructor(options = {}) {
        this.options = options;
        this.test = /\.(scss|sass)$/;
    }
    init(context) {
        context.allowExtension(".scss");
        context.allowExtension(".sass");
        this.context = context;
    }
    transform(file) {
        file.addStringDependency("fuse-box-css");
        const context = file.context;
        if (file.isCSSCached("sass")) {
            return;
        }
        file.bustCSSCache = true;
        file.loadContents();
        if (!file.contents) {
            return;
        }
        if (!sass) {
            sass = require("node-sass");
        }
        const defaultMacro = {
            $homeDir: file.context.homeDir,
            $appRoot: context.appRoot,
            "~": Config_1.Config.NODE_MODULES_DIR + "/",
        };
        if (this.options.header) {
            file.contents = this.options.header + "\n" + file.contents;
        }
        if (this.options.resources) {
            let resourceFile;
            this.options.resources.forEach(item => {
                if (item.test.test(file.info.absPath)) {
                    resourceFile = item.file;
                }
            });
            if (resourceFile) {
                const relativePath = path.relative(file.info.absDir, Utils_1.ensureAbsolutePath(resourceFile));
                file.contents = `@import "${relativePath}";` + "\n" + file.contents;
            }
        }
        const options = Object.assign({
            data: file.contents,
            file: context.homeDir + "/" + file.info.fuseBoxPath,
            sourceMap: true,
            outFile: file.info.fuseBoxPath,
            sourceMapContents: true,
        }, this.options);
        options.includePaths = [];
        if (typeof this.options.includePaths !== "undefined") {
            this.options.includePaths.forEach(path => {
                options.includePaths.push(path);
            });
        }
        options.macros = Object.assign(defaultMacro, this.options.macros || {});
        if (this.options.importer === true) {
            options.importer = (url, prev, done) => {
                if (/https?:/.test(url)) {
                    return done({ url });
                }
                for (let key in options.macros) {
                    if (options.macros.hasOwnProperty(key)) {
                        url = url.replace(key, options.macros[key]);
                    }
                }
                let file = path.normalize(url);
                if (context.extensionOverrides) {
                    file = context.extensionOverrides.getPathOverride(file) || file;
                }
                done({ file });
            };
        }
        options.includePaths.push(file.info.absDir);
        const cssDependencies = file.context.extractCSSDependencies(file, {
            paths: options.includePaths,
            content: file.contents,
            sassStyle: true,
            importer: options.importer,
            extensions: ["css", options.indentedSyntax ? "sass" : "scss"],
        });
        file.cssDependencies = cssDependencies;
        return new Promise((resolve, reject) => {
            return sass.render(options, (err, result) => {
                if (err) {
                    const errorFile = err.file === "stdin" ? file.absPath : err.file;
                    file.contents = "";
                    file.addError(`${err.message}\n      at ${errorFile}:${err.line}:${err.column}`);
                    return resolve();
                }
                file.sourceMap = result.map && result.map.toString();
                file.contents = result.css.toString();
                if (context.useCache) {
                    file.analysis.dependencies = cssDependencies;
                    context.cache.writeStaticCache(file, file.sourceMap, "sass");
                    file.analysis.dependencies = [];
                }
                return resolve();
            });
        });
    }
}
exports.SassPluginClass = SassPluginClass;
exports.SassPlugin = (options) => {
    return new SassPluginClass(options);
};
