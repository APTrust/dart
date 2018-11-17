"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
const Bundle_1 = require("../../core/Bundle");
const Utils_1 = require("../../Utils");
const fs = require("fs");
const File_1 = require("../../core/File");
const CSSOptimizer_1 = require("./CSSOptimizer");
class BundleWriter {
    constructor(core) {
        this.core = core;
        this.bundles = new Map();
    }
    getUglifyJSOptions() {
        const opts = this.core.opts.shouldUglify() || {};
        const useUglifyEs = this.core.context.languageLevel > File_1.ScriptTarget.ES5 || !!opts.es6;
        if (useUglifyEs) {
            this.core.context.log.echoInfo("Using uglify-es because the target is greater than ES5 or es6 option is set");
        }
        else {
            this.core.context.log.echoInfo("Using uglify-js because the target is set to ES5 and no es6 option is set");
        }
        return {
            ...opts,
            es6: useUglifyEs,
        };
    }
    createBundle(name, code) {
        let bundle = new Bundle_1.Bundle(name, this.core.producer.fuse.copy(), this.core.producer);
        if (code) {
            bundle.generatedCode = new Buffer(code);
        }
        this.bundles.set(bundle.name, bundle);
        return bundle;
    }
    addShims() {
        const producer = this.core.producer;
        if (producer.fuse.context.shim) {
            const shims = [];
            for (let name in producer.fuse.context.shim) {
                let item = producer.fuse.context.shim[name];
                if (item.source) {
                    let shimPath = Utils_1.ensureUserPath(item.source);
                    if (!fs.existsSync(shimPath)) {
                        console.warn(`Shim error: Not found: ${shimPath}`);
                    }
                    else {
                        shims.push(fs.readFileSync(shimPath).toString());
                    }
                }
            }
            if (shims.length) {
                this.createBundle(this.core.opts.shimsPath, shims.join("\n"));
            }
        }
    }
    uglifyBundle(bundle) {
        this.core.log.echoInfo(`Uglifying ${bundle.name}...`);
        const result = Utils_1.uglify(bundle.generatedCode, this.getUglifyJSOptions());
        if (result.error) {
            this.core.log.echoBoldRed(`  → Error during uglifying ${bundle.name}`).error(result.error);
            throw result.error;
        }
        bundle.generatedCode = result.code;
        this.core.log.echoInfo(`Done uglifying ${bundle.name}`);
        this.core.log.echoGzip(result.code);
    }
    async process() {
        const producer = this.core.producer;
        const bundleManifest = {};
        this.addShims();
        producer.bundles.forEach(bundle => {
            this.bundles.set(bundle.name, bundle);
        });
        if (this.core.opts.isContained() && producer.bundles.size > 1) {
            this.core.opts.throwContainedAPIError();
        }
        if (this.core.opts.shouldCreateApiBundle()) {
            this.createBundle("api.js");
        }
        producer.bundles = this.bundles;
        let splitFileOptions;
        if (this.core.context.quantumBits.size > 0) {
            const splitConf = this.core.context.quantumSplitConfig;
            splitFileOptions = {
                c: {
                    b: splitConf.getBrowserPath(),
                    s: splitConf.getServerPath(),
                },
                i: {},
            };
            this.core.api.setBundleMapping(splitFileOptions);
            this.core.quantumBits.forEach(bit => {
                if (bit.banned) {
                    splitFileOptions.i[bit.name] = bit.entry.getID();
                }
            });
        }
        let index = 1;
        const writeBundle = async (bundle) => {
            const output = await bundle.context.output.writeCurrent(bundle.generatedCode);
            let entryString;
            if (bundle.quantumBit && bundle.quantumBit.entry) {
                entryString = bundle.quantumBit.entry.getFuseBoxFullPath();
            }
            bundleManifest[bundle.name] = {
                fileName: output.filename,
                hash: output.hash,
                type: "js",
                entry: entryString,
                absPath: output.path,
                webIndexed: !bundle.quantumBit,
                relativePath: output.relativePath,
            };
            if (bundle.quantumBit) {
                const splitOpts = [output.relativePath, bundle.quantumBit.entry.getID()];
                splitFileOptions.i[bundle.quantumBit.name] = splitOpts;
                const cssCollection = bundle.quantumBit.cssCollection;
                if (cssCollection) {
                    let cssName = bundle.quantumBit.name;
                    if (!/\.css$/.test(cssName)) {
                        cssName = `${cssName}.css`;
                    }
                    const splitConfig = this.core.context.quantumSplitConfig;
                    const output = await writeCSS(cssCollection, cssName);
                    if (bundle.quantumBit && splitConfig && splitConfig.resolveOptions) {
                        const dest = splitConfig.getDest();
                        cssName = Utils_1.joinFuseBoxPath(dest, output.filename);
                    }
                    else {
                        cssName = output.filename;
                    }
                    splitOpts.push({ css: true, name: cssName });
                }
            }
        };
        const writeCSS = async (cssCollection, key) => {
            if (cssCollection.written) {
                return;
            }
            const cssData = cssCollection.collection;
            if (cssData.size > 0) {
                const output = this.core.producer.fuse.context.output;
                let name = key === "default"
                    ? this.core.opts.getCSSPath()
                    : this.core.opts.getCSSFiles()
                        ? this.core.opts.getCSSFiles()[key]
                        : key;
                if (!/\.css$/.test(name)) {
                    name = `${name}.css`;
                }
                const splitConfig = this.core.context.quantumSplitConfig;
                if (cssCollection.quantumBit && splitConfig && splitConfig.resolveOptions) {
                    const dest = splitConfig.getDest();
                    name = Utils_1.joinFuseBoxPath(dest, name);
                }
                cssCollection.render(name);
                let useSourceMaps = cssCollection.useSourceMaps;
                const cleanCSSOptions = this.core.opts.getCleanCSSOptions();
                if (cleanCSSOptions) {
                    const optimer = new CSSOptimizer_1.CSSOptimizer(this.core);
                    optimer.optimize(cssCollection, cleanCSSOptions);
                }
                const cssResultData = await output.writeToOutputFolder(name, cssCollection.getString(), true);
                bundleManifest[name] = {
                    fileName: cssResultData.filename,
                    type: "css",
                    hash: cssResultData.hash,
                    absPath: cssResultData.path,
                    relativePath: cssResultData.relativePath,
                    webIndexed: cssCollection.splitCSS ? false : true,
                };
                if (!cssCollection.splitCSS) {
                    this.core.producer.injectedCSSFiles.add(cssResultData.filename);
                }
                if (useSourceMaps) {
                    output.writeToOutputFolder(cssCollection.sourceMapsPath, cssCollection.sourceMap);
                }
                cssCollection.written = true;
                return cssResultData;
            }
        };
        return realm_utils_1.each(producer.bundles, (bundle) => {
            if (bundle.name === "api.js") {
                bundle.webIndexPriority = 1000;
                if (this.core.opts.isContained()) {
                    this.core.opts.throwContainedAPIError();
                }
                bundle.generatedCode = new Buffer(this.core.api.render());
            }
            else {
                bundle.webIndexPriority = 1000 - index;
            }
            if (!this.core.opts.shouldBakeApiIntoBundle(bundle.name)) {
                if (this.core.opts.shouldUglify()) {
                    this.uglifyBundle(bundle);
                }
                index++;
                return writeBundle(bundle);
            }
        })
            .then(async () => {
            if (!this.core.opts.shouldCreateApiBundle()) {
                this.core.opts.getMissingBundles(producer.bundles).forEach(bundle => {
                    this.core.log.echoBoldRed(`  → Error. Can't find bundle name ${bundle}`);
                });
                for (const [name, bundle] of producer.bundles) {
                    if (this.core.opts.shouldBakeApiIntoBundle(name)) {
                        const generatedAPIBundle = this.core.api.render();
                        if (this.core.opts.isContained()) {
                            bundle.generatedCode = new Buffer(bundle.generatedCode
                                .toString()
                                .replace("/*$$CONTAINED_API_PLACEHOLDER$$*/", generatedAPIBundle.toString()));
                        }
                        else {
                            bundle.generatedCode = new Buffer(generatedAPIBundle + "\n" + bundle.generatedCode);
                        }
                        if (this.core.opts.shouldUglify()) {
                            this.uglifyBundle(bundle);
                        }
                        await writeBundle(bundle);
                    }
                }
            }
        })
            .then(async () => {
            if (this.core.opts.shouldGenerateCSS()) {
                for (const item of this.core.cssCollection) {
                    const cssCollection = item[1];
                    await writeCSS(cssCollection, item[0]);
                }
            }
        })
            .then(() => {
            const manifestPath = this.core.opts.getManifestFilePath();
            if (manifestPath) {
                this.core.producer.fuse.context.output.writeToOutputFolder(manifestPath, JSON.stringify(bundleManifest, null, 2));
            }
            if (this.core.opts.webIndexPlugin) {
                return this.core.opts.webIndexPlugin.producerEnd(producer);
            }
        })
            .then(() => {
            this.core.producer.bundles.forEach(bundle => {
                if (bundle.onDoneCallback) {
                    bundle.process.setFilePath(bundle.fuse.context.output.lastWrittenPath);
                    bundle.onDoneCallback(bundle.process);
                }
            });
        });
    }
}
exports.BundleWriter = BundleWriter;
