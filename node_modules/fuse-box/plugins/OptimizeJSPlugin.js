"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OptimizeJSClass {
    constructor(opts) {
        this.test = /\.(j|t)s(x)?$/;
        this.opts = null;
        if (opts !== null)
            this.opts = opts;
    }
    static init(config) {
        return new OptimizeJSClass(config);
    }
    init(context) {
        this.context = context;
    }
    transform(file, ast) {
        const optimizeJs = require("optimize-js");
        let output;
        try {
            output = optimizeJs(file.contents, this.opts);
            if (this.context.doLog === true) {
                file.context.debug("OptimizeJSPlugin", `\n\tOptimized: ${JSON.stringify(this.opts)}`);
            }
            file.contents = output;
        }
        catch (error) {
            this.context.log.echoWarning("error in OptimizeJSPlugin");
        }
        file.analysis.analyze();
    }
}
exports.OptimizeJSClass = OptimizeJSClass;
exports.OptimizeJSPlugin = OptimizeJSClass.init;
