"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BundleSource_1 = require("../BundleSource");
class UglifyJSPluginClass {
    constructor(options = {}) {
        this.options = options;
    }
    postBundle(context) {
        const mainOptions = {};
        const UglifyJs = require("uglify-js");
        if (UglifyJs.mangle_properties !== undefined) {
            mainOptions.fromString = true;
        }
        const includeSourceMaps = context.source.includeSourceMaps;
        const concat = context.source.getResult();
        const source = concat.content.toString();
        const sourceMap = concat.sourceMap;
        const newSource = new BundleSource_1.BundleSource(context);
        newSource.includeSourceMaps = includeSourceMaps;
        context.source = newSource;
        const newConcat = context.source.getResult();
        if ("sourceMapConfig" in context) {
            if (context.sourceMapConfig.bundleReference) {
                mainOptions.inSourceMap = JSON.parse(sourceMap);
                mainOptions.outSourceMap = context.sourceMapConfig.bundleReference;
            }
        }
        if (includeSourceMaps) {
            mainOptions.inSourceMap = JSON.parse(sourceMap);
            mainOptions.outSourceMap = `${context.output.filename}.js.map`;
        }
        let timeStart = process.hrtime();
        var opt = {
            ...this.options,
            ...mainOptions,
        };
        const result = UglifyJs.minify(source, opt);
        if (result.error) {
            const message = `UglifyJSPlugin - ${result.error.message}`;
            context.log.echoError(message);
            return Promise.reject(result.error);
        }
        let took = process.hrtime(timeStart);
        let bytes = Buffer.byteLength(result.code, "utf8");
        context.log.echoBundleStats("Bundle (Uglified)", bytes, took);
        newConcat.add(null, result.code, result.map || sourceMap);
    }
}
exports.UglifyJSPluginClass = UglifyJSPluginClass;
exports.UglifyJSPlugin = (options) => {
    return new UglifyJSPluginClass(options);
};
