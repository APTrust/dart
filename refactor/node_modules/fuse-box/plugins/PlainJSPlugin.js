"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PlainJSPluginClass {
    constructor() {
        this.test = /\.js$/;
    }
    transform(file) {
        let context = file.context;
        if (context.useCache) {
            if (file.loadFromCache()) {
                return;
            }
        }
        if (context.useCache) {
            context.emitJavascriptHotReload(file);
            context.cache.writeStaticCache(file, file.sourceMap);
        }
    }
}
exports.PlainJSPluginClass = PlainJSPluginClass;
exports.PlainJSPlugin = () => {
    return new PlainJSPluginClass();
};
