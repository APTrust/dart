"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FuseBoxJSONPlugin {
    constructor() {
        this.test = /\.json$/;
    }
    init(context) {
        context.allowExtension(".json");
    }
    transform(file) {
        const context = file.context;
        if (context.useCache) {
            if (file.loadFromCache()) {
                return;
            }
        }
        file.loadContents();
        file.contents = `module.exports = ${file.contents || {}};`;
        if (context.useCache) {
            context.emitJavascriptHotReload(file);
            context.cache.writeStaticCache(file, file.sourceMap);
        }
    }
}
exports.FuseBoxJSONPlugin = FuseBoxJSONPlugin;
exports.JSONPlugin = () => {
    return new FuseBoxJSONPlugin();
};
