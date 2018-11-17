"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Utils_1 = require("../../Utils");
const Config_1 = require("../../Config");
class ResponsiveAPI {
    constructor(core) {
        this.core = core;
        this.computedStatements = false;
        this.hashes = false;
        this.isServerFunction = false;
        this.isBrowserFunction = false;
        this.customMappings = {};
        this.lazyLoading = false;
        this.customStatementResolve = false;
        this.serverRequire = false;
        this.ajaxRequired = false;
        this.codeSplitting = false;
        this.jsonLoader = false;
        this.loadRemoteScript = false;
        this.cssLoader = false;
    }
    addComputedRequireStatetements() {
        this.computedStatements = true;
        this.hashes = true;
    }
    addLazyLoading() {
        this.lazyLoading = true;
        if (this.core.opts.isTargetUniveral()) {
            this.ajaxRequired = true;
        }
        if (this.core.opts.isTargetBrowser()) {
            this.ajaxRequired = true;
        }
    }
    useCodeSplitting() {
        this.codeSplitting = true;
    }
    addJSONLoader() {
        this.jsonLoader = true;
    }
    addCSSLoader() {
        this.cssLoader = true;
    }
    addRemoteLoading() {
        this.loadRemoteScript = true;
    }
    hashesUsed() {
        return this.hashes;
    }
    addMapping(fuseBoxPath, id) {
        this.customMappings[fuseBoxPath] = id;
        this.customStatementResolve = true;
    }
    setBundleMapping(data) {
        this.bundleMapping = data;
    }
    addIsServerFunction() {
        this.isServerFunction = true;
    }
    addIsBrowserFunction() {
        this.isBrowserFunction = true;
    }
    useServerRequire() {
        this.serverRequire = true;
    }
    considerStatement(statement) {
        this.addLazyLoading();
        if (statement.isComputed) {
            this.addRemoteLoading();
            this.addCSSLoader();
            this.addJSONLoader();
        }
        if (statement.isRemoteURL()) {
            this.addRemoteLoading();
        }
        if (statement.isCSSRequested()) {
            this.loadRemoteScript = true;
            this.addCSSLoader();
        }
        if (statement.isJSONRequested()) {
            this.addJSONLoader();
        }
    }
    render() {
        const promisePolyfill = this.core.opts.getPromisePolyfill();
        const options = {
            browser: this.core.opts.isTargetBrowser(),
            universal: this.core.opts.isTargetUniveral(),
            server: this.core.opts.isTargetServer(),
            globalRequire: this.core.opts.globalRequire,
            isServerFunction: this.isServerFunction,
            isBrowserFunction: this.isBrowserFunction,
            computedStatements: this.computedStatements,
            allowSyntheticDefaultImports: this.core.context.fuse.producer.allowSyntheticDefaultImports === true,
            hashes: this.hashes,
            serverRequire: this.serverRequire,
            customStatementResolve: this.customStatementResolve,
            lazyLoading: this.lazyLoading,
            codeSplitting: this.codeSplitting,
            ajaxRequired: this.ajaxRequired,
            jsonLoader: this.jsonLoader,
            cssLoader: this.cssLoader,
            promisePolyfill: false,
            loadRemoteScript: this.loadRemoteScript,
            isContained: this.core.opts.isContained(),
            extendServerImport: this.core.opts.shouldExtendServerImport(),
            runtimeBundleMapping: this.core.opts.shouldSetBundleMappingsAtRuntime(),
        };
        const variables = {};
        const raw = {};
        let replaceRaw = {};
        if (Object.keys(this.customMappings).length > 0) {
            variables.customMappings = this.customMappings;
        }
        if (promisePolyfill) {
            options.promisePolyfill = true;
            raw.promisePolyfill = promisePolyfill;
        }
        if (this.bundleMapping) {
            variables.bundleMapping = this.bundleMapping;
        }
        if (this.core.opts.shouldSetBundleMappingsAtRuntime()) {
            variables.runtimeBundleMappingVariableName = this.core.opts.runtimeBundleMapping;
        }
        if (this.core.opts.quantumVariableName !== "$fsx") {
            replaceRaw = { $fsx: this.core.opts.quantumVariableName };
        }
        return Utils_1.jsCommentTemplate(path.join(Config_1.Config.FUSEBOX_MODULES, "fuse-box-responsive-api/index.js"), options, variables, raw, replaceRaw);
    }
}
exports.ResponsiveAPI = ResponsiveAPI;
