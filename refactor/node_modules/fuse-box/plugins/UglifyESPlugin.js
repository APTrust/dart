"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BundleSource_1 = require("../BundleSource");
class UglifyESPluginClass {
    constructor(options = {}) {
        this.options = options;
    }
    postBundle(context) {
        const mainOptions = {};
        const UglifyES = require("uglify-es");
        const concat = context.source.getResult();
        const source = concat.content.toString();
        const sourceMap = concat.sourceMap;
        const newSource = new BundleSource_1.BundleSource(context);
        context.source = newSource;
        const newConcat = context.source.getResult();
        if ("sourceMapConfig" in context) {
            if (context.sourceMapConfig.bundleReference) {
                mainOptions.inSourceMap = JSON.parse(sourceMap);
                mainOptions.outSourceMap = context.sourceMapConfig.bundleReference;
            }
        }
        let timeStart = process.hrtime();
        const result = UglifyES.minify(source, {
            ...this.options,
            ...mainOptions,
        });
        let took = process.hrtime(timeStart);
        let bytes = Buffer.byteLength(result.code, "utf8");
        context.log.echoBundleStats("Bundle (Uglified)", bytes, took);
        newConcat.add(null, result.code, result.map || sourceMap);
    }
}
exports.UglifyESPluginClass = UglifyESPluginClass;
exports.UglifyESPlugin = (options) => {
    return new UglifyESPluginClass(options);
};
