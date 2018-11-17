"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QuantumOptions_1 = require("./QuantumOptions");
const QuantumCore_1 = require("./QuantumCore");
class QuantumPluginClass {
    constructor(coreOpts) {
        if (coreOpts) {
            this.coreOpts = coreOpts;
        }
        else {
            this.coreOpts = {};
        }
    }
    init(context) {
        context.bundle.producer.writeBundles = false;
        context.bundle.producer.hmrAllowed = false;
        context.bundle.producer.bundles.forEach(bundle => {
            const plugins = bundle.context.plugins;
            plugins.forEach((plugin, index) => {
                if (plugin && plugin.constructor) {
                    if (plugin.constructor.name === "UglifyJSPluginClass") {
                        this.coreOpts.uglify = plugin.options || {};
                        delete plugins[index];
                    }
                    if (plugin.constructor.name === "UglifyESPluginClass") {
                        this.coreOpts.uglify = { es6: true, ...plugin.options };
                        delete plugins[index];
                    }
                    if (plugin.constructor.name === "WebIndexPluginClass") {
                        this.coreOpts.webIndexPlugin = plugin;
                        delete plugins[index];
                    }
                    if (plugin.constructor.name === "HotReloadPluginClass") {
                        delete plugins[index];
                    }
                }
            });
        });
    }
    consume(producer) {
        let core = new QuantumCore_1.QuantumCore(producer, new QuantumOptions_1.QuantumOptions(producer, this.coreOpts));
        return core.consume();
    }
    producerEnd(producer) {
        producer.sharedEvents.on("file-changed", () => {
            this.consume(producer);
        });
        return this.consume(producer);
    }
}
exports.QuantumPluginClass = QuantumPluginClass;
exports.QuantumPlugin = (opts) => {
    return new QuantumPluginClass(opts);
};
