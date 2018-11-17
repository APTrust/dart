"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../../Utils");
class QuantumOptions {
    constructor(producer, opts) {
        this.producer = producer;
        this.removeExportsInterop = false;
        this.removeUseStrict = true;
        this.ensureES5 = false;
        this.replaceProcessEnv = true;
        this.containedAPI = false;
        this.processPolyfill = false;
        this.noConflictApi = false;
        this.replaceTypeOf = true;
        this.showWarnings = true;
        this.hoisting = false;
        this.globalRequire = true;
        this.extendServerImport = false;
        this.shimsPath = "shims.js";
        this.optsTarget = "browser";
        this.treeshake = false;
        this.css = false;
        this.cssPath = "styles.css";
        this.quantumVariableName = "$fsx";
        opts = opts || {};
        if (opts.target) {
            this.optsTarget = opts.target;
        }
        else {
            this.optsTarget = this.producer.fuse.context.target;
        }
        if (opts.css) {
            this.css = true;
            if (typeof opts.css === "object") {
                this.cssPath = opts.css.path || "styles.css";
                this.cleanCSS = opts.css.clean !== undefined ? opts.css.clean : true;
            }
            else {
                this.cleanCSS = true;
            }
        }
        if (opts.cssFiles) {
            this.cssFiles = opts.cssFiles;
        }
        if (opts.api) {
            this.apiCallback = opts.api;
        }
        if (opts.definedExpressions) {
            this.definedExpressions = opts.definedExpressions;
        }
        if (opts.manifest !== undefined) {
            if (typeof opts.manifest === "string") {
                this.manifestFile = opts.manifest;
            }
            if (opts.manifest === true) {
                this.manifestFile = "manifest.json";
            }
        }
        if (opts.uglify) {
            this.uglify = opts.uglify;
        }
        if (opts.noConflictApi !== undefined) {
            this.noConflictApi = opts.noConflictApi;
        }
        if (opts.processPolyfill !== undefined) {
            this.processPolyfill = opts.processPolyfill;
        }
        if (opts.shimsPath) {
            this.shimsPath = opts.shimsPath;
        }
        if (opts.warnings !== undefined) {
            this.showWarnings = opts.warnings;
        }
        if (opts.globalRequire !== undefined) {
            this.globalRequire = opts.globalRequire;
        }
        if (opts.replaceTypeOf !== undefined) {
            this.replaceTypeOf = opts.replaceTypeOf;
        }
        if (opts.containedAPI !== undefined) {
            this.containedAPI = opts.containedAPI;
        }
        if (Array.isArray(opts.polyfills)) {
            this.polyfills = opts.polyfills;
        }
        if (opts.removeExportsInterop !== undefined) {
            this.removeExportsInterop = opts.removeExportsInterop;
        }
        if (opts.replaceProcessEnv !== undefined) {
            this.replaceProcessEnv = opts.replaceProcessEnv;
        }
        if (opts.removeUseStrict !== undefined) {
            this.removeUseStrict = opts.removeUseStrict;
        }
        if (opts.webIndexPlugin) {
            this.webIndexPlugin = opts.webIndexPlugin;
        }
        if (opts.hoisting !== undefined) {
            if (typeof opts.hoisting === "boolean") {
                this.hoisting = opts.hoisting;
            }
            else {
                this.hoisting = true;
                const hoistingOptions = opts.hoisting;
                this.hoistedNames = hoistingOptions.names;
            }
        }
        if (opts.bakeApiIntoBundle) {
            if (typeof opts.bakeApiIntoBundle === "string") {
                this.bakeApiIntoBundle = [opts.bakeApiIntoBundle];
            }
            else {
                this.bakeApiIntoBundle = opts.bakeApiIntoBundle;
            }
        }
        if (opts.extendServerImport !== undefined) {
            this.extendServerImport = opts.extendServerImport;
        }
        if (opts.ensureES5 !== undefined) {
            this.ensureES5 = opts.ensureES5;
        }
        if (opts.treeshake !== undefined) {
            if (typeof opts.treeshake === "boolean") {
                this.treeshake = opts.treeshake;
            }
            else {
                this.treeshake = true;
                this.treeshakeOptions = opts.treeshake;
            }
        }
        if (this.isContained() || this.noConflictApi === true) {
            this.genenerateQuantumVariableName();
        }
        if (opts.runtimeBundleMapping !== undefined && typeof opts.runtimeBundleMapping == "string") {
            this.runtimeBundleMapping = opts.runtimeBundleMapping;
        }
    }
    shouldSetBundleMappingsAtRuntime() {
        return !!this.runtimeBundleMapping;
    }
    shouldGenerateCSS() {
        return this.css === true || this.cssFiles;
    }
    getCleanCSSOptions() {
        return this.cleanCSS;
    }
    getCSSPath() {
        return this.cssPath;
    }
    getCSSFiles() {
        return this.cssFiles;
    }
    getCSSSourceMapsPath() {
        return `${this.cssPath}.map`;
    }
    genenerateQuantumVariableName() {
        let randomHash = Utils_1.hashString(new Date().getTime().toString() + Math.random());
        if (randomHash.indexOf("-") === 0) {
            randomHash = randomHash.slice(1);
        }
        if (randomHash.length >= 7) {
            randomHash = randomHash.slice(2, 6);
        }
        this.quantumVariableName = "_" + randomHash;
    }
    shouldBundleProcessPolyfill() {
        return this.processPolyfill === true;
    }
    enableContainedAPI() {
        return (this.containedAPI = true);
    }
    shouldReplaceTypeOf() {
        return this.replaceTypeOf;
    }
    getPromisePolyfill() {
        if (this.polyfills && this.polyfills.indexOf("Promise") > -1) {
            return Utils_1.readFuseBoxModule("fuse-box-responsive-api/promise-polyfill.js");
        }
    }
    getManifestFilePath() {
        return this.manifestFile;
    }
    canBeRemovedByTreeShaking(file) {
        if (this.treeshakeOptions) {
            if (this.treeshakeOptions.shouldRemove) {
                return this.treeshakeOptions.shouldRemove(file);
            }
        }
        return true;
    }
    isContained() {
        return this.containedAPI;
    }
    throwContainedAPIError() {
        throw new Error(`
           - Can't use contained api with more than 1 bundle
           - Use only 1 bundle and bake the API e.g {bakeApiIntoBundle : "app"}
           - Make sure code splitting is not in use
        `);
    }
    shouldRemoveUseStrict() {
        return this.removeUseStrict;
    }
    shouldEnsureES5() {
        return this.ensureES5;
    }
    shouldDoHoisting() {
        return this.hoisting;
    }
    getHoistedNames() {
        return this.hoistedNames;
    }
    isHoistingAllowed(name) {
        if (this.hoistedNames) {
            return this.hoistedNames.indexOf(name) > -1;
        }
        return true;
    }
    shouldExtendServerImport() {
        return this.extendServerImport;
    }
    shouldShowWarnings() {
        return this.showWarnings;
    }
    shouldUglify() {
        return this.uglify;
    }
    shouldCreateApiBundle() {
        return !this.bakeApiIntoBundle;
    }
    shouldBakeApiIntoBundle(bundleName) {
        return (this.bakeApiIntoBundle && (this.bakeApiIntoBundle === true || this.bakeApiIntoBundle.indexOf(bundleName) !== -1));
    }
    getMissingBundles(bundles) {
        if (!this.bakeApiIntoBundle || this.bakeApiIntoBundle === true) {
            return [];
        }
        return this.bakeApiIntoBundle.filter(bundle => !bundles.has(bundle));
    }
    shouldTreeShake() {
        return this.treeshake;
    }
    shouldRemoveExportsInterop() {
        return this.removeExportsInterop;
    }
    shouldReplaceProcessEnv() {
        return this.replaceProcessEnv;
    }
    getTarget() {
        return this.optsTarget;
    }
    isTargetElectron() {
        return this.optsTarget === "electron";
    }
    isTargetUniveral() {
        return this.optsTarget === "universal" || this.optsTarget === "npm-universal";
    }
    isTargetNpm() {
        return (this.optsTarget === "npm" ||
            this.optsTarget === "npm-server" ||
            this.optsTarget === "npm-browser" ||
            this.optsTarget === "npm-universal");
    }
    isTargetServer() {
        return (this.optsTarget === "server" ||
            this.optsTarget === "electron" ||
            this.optsTarget === "npm" ||
            this.optsTarget === "npm-server");
    }
    isTargetBrowser() {
        return this.optsTarget === "browser" || this.optsTarget === "npm-browser";
    }
}
exports.QuantumOptions = QuantumOptions;
