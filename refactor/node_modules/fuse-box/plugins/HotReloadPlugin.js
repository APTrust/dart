"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HotReloadPluginClass {
    constructor(opts = {}) {
        this.dependencies = ["fusebox-hot-reload"];
        this.port = "";
        this.uri = "";
        this.reload = false;
        if (opts.port) {
            this.port = opts.port;
        }
        if (opts.uri) {
            this.uri = opts.uri;
        }
        if (opts.reload === true) {
            this.reload = true;
        }
    }
    init() { }
    bundleEnd(context) {
        context.source.addContent(`FuseBox.import("fusebox-hot-reload").connect(${this.port}, ${JSON.stringify(this.uri)}, ${this.reload ? "true" : "false"})`);
    }
}
exports.HotReloadPluginClass = HotReloadPluginClass;
exports.HotReloadPlugin = (options) => {
    return new HotReloadPluginClass(options);
};
