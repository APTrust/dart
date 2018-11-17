"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EnvPluginClass {
    constructor(env) {
        this.env = env;
    }
    bundleStart(context) {
        const producer = context.bundle.producer;
        if (producer) {
            producer.addUserProcessEnvVariables(this.env);
        }
        if (context.target === "server") {
            context.source.addContent(`Object.assign(process.env, ${JSON.stringify(this.env)})`);
        }
        else if (context.target === "electron") {
            context.source.addContent(`Object.assign(global.process.env, ${JSON.stringify(this.env)})`);
        }
        else {
            context.source.addContent(`var __process_env__ = ${JSON.stringify(this.env)};`);
        }
    }
}
exports.EnvPluginClass = EnvPluginClass;
exports.EnvPlugin = (options) => {
    return new EnvPluginClass(options);
};
