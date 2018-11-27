"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
const Utils_1 = require("../Utils");
class RawPluginClass {
    constructor(options = []) {
        this.test = /.*/;
        if (realm_utils_1.utils.isPlainObject(options)) {
            if ("extensions" in (options || {}))
                this.extensions = options.extensions;
        }
        if (realm_utils_1.utils.isArray(options)) {
            this.extensions = [];
            options.forEach(str => {
                this.extensions.push("." + Utils_1.extractExtension(str));
            });
            this.test = Utils_1.string2RegExp(options.join("|"));
        }
    }
    init(context) {
        if (Array.isArray(this.extensions)) {
            return this.extensions.forEach(ext => context.allowExtension(ext));
        }
    }
    isRefreshRequired(file) {
        const bundle = file.context.bundle;
        if (bundle && bundle.lastChangedFile) {
            const lastFile = file.context.convertToFuseBoxPath(bundle.lastChangedFile);
            if (Utils_1.isStylesheetExtension(bundle.lastChangedFile)) {
                return (lastFile === file.info.fuseBoxPath ||
                    file.context.getItem("HMR_FILE_REQUIRED", []).indexOf(file.info.fuseBoxPath) > -1 ||
                    !!file.subFiles.find(subFile => subFile.info.fuseBoxPath === bundle.lastChangedFile));
            }
        }
    }
    transform(file) {
        const context = file.context;
        if (context.useCache && !this.isRefreshRequired(file)) {
            let cached = context.cache.getStaticCache(file);
            if (cached) {
                file.isLoaded = true;
                file.analysis.skip();
                file.sourceMap = undefined;
                file.contents = cached.contents;
                return;
            }
        }
        file.loadContents();
        file.sourceMap = undefined;
        file.contents = `module.exports = ${JSON.stringify(file.contents)}`;
        if (context.useCache) {
            context.emitJavascriptHotReload(file);
            context.cache.writeStaticCache(file, file.sourceMap);
        }
    }
}
exports.RawPluginClass = RawPluginClass;
exports.RawPlugin = (options) => {
    return new RawPluginClass(options);
};
