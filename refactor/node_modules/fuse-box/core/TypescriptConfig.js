"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Utils_1 = require("../Utils");
const File_1 = require("./File");
const fs = require("fs");
const Config_1 = require("../Config");
const ts = require("typescript");
const CACHED = {};
class TypescriptConfig {
    constructor(context) {
        this.context = context;
    }
    getConfig() {
        this.read();
        return this.config;
    }
    defaultSetup() {
        const compilerOptions = (this.config.compilerOptions = this.config.compilerOptions || {});
        if (this.context.useSourceMaps) {
            compilerOptions.sourceMap = true;
            compilerOptions.inlineSources = true;
        }
        if (this.context.forcedLanguageLevel) {
            this.forceCompilerTarget(this.context.forcedLanguageLevel);
        }
        if (compilerOptions.baseUrl === "." && this.context.automaticAlias) {
            let aliasConfig = {};
            let log = [];
            fs.readdirSync(this.context.homeDir).forEach(file => {
                const extension = path.extname(file);
                if (!extension || extension === ".ts" || extension === ".tsx") {
                    let name = file;
                    if (extension) {
                        name = file.replace(/\.tsx?/, "");
                    }
                    log.push(`\t${name} => "~/${name}"`);
                    aliasConfig[name] = `~/${name}`;
                }
            });
            this.context.log.echoInfo(`Applying automatic alias based on baseUrl in tsconfig.json`);
            this.context.log.echoInfo(`\n ${log.join("\n")}`);
            this.context.addAlias(aliasConfig);
        }
    }
    forceCompilerTarget(level) {
        this.context.log.echoInfo(`Typescript forced script target: ${File_1.ScriptTarget[level]}`);
        const compilerOptions = (this.config.compilerOptions = this.config.compilerOptions || {});
        compilerOptions.target = File_1.ScriptTarget[level];
    }
    setConfigFile(customTsConfig) {
        this.customTsConfig = customTsConfig;
    }
    initializeConfig() {
        const compilerOptions = this.config.compilerOptions;
        compilerOptions.jsx = "react";
        compilerOptions.importHelpers = true;
        compilerOptions.emitDecoratorMetadata = true;
        compilerOptions.experimentalDecorators = true;
        const targetFile = path.join(this.context.homeDir, "tsconfig.json");
        this.context.log.echoInfo(`Generating recommended tsconfig.json:  ${targetFile}`);
        fs.writeFileSync(targetFile, JSON.stringify(this.config, null, 2));
    }
    verifyTsLib() {
        if (this.config.compilerOptions.importHelpers === true) {
            const tslibPath = path.join(Config_1.Config.NODE_MODULES_DIR, "tslib");
            if (!fs.existsSync(tslibPath)) {
                this.context.log.echoWarning(`You have enabled importHelpers. Please install tslib - https://github.com/Microsoft/tslib`);
            }
        }
    }
    read() {
        const cacheKey = (typeof this.customTsConfig === "string" ? this.customTsConfig : this.context.homeDir) +
            this.context.target +
            this.context.languageLevel;
        if (CACHED[cacheKey]) {
            this.config = CACHED[cacheKey];
        }
        else {
            let url;
            let config = {
                compilerOptions: {},
            };
            let configFileFound = false;
            let tsConfigOverride;
            if (typeof this.customTsConfig === "string") {
                this.configFile = Utils_1.ensureUserPath(this.customTsConfig);
            }
            else {
                url = path.join(this.context.homeDir, "tsconfig.json");
                let tsconfig = Utils_1.findFileBackwards(url, this.context.appRoot);
                if (tsconfig) {
                    configFileFound = true;
                    this.configFile = tsconfig;
                }
            }
            if (this.configFile) {
                const configFileRelPath = this.configFile.replace(this.context.appRoot, "");
                this.context.log.echoInfo(`Typescript config file:  ${configFileRelPath}`);
                configFileFound = true;
                const res = readConfigFile(this.configFile, this.context.appRoot);
                config = res.config;
                if (res.error) {
                    this.context.log.echoError(`Errors in ${configFileRelPath}`);
                }
            }
            if (Array.isArray(this.customTsConfig)) {
                tsConfigOverride = this.customTsConfig[0];
            }
            config.compilerOptions.module = "commonjs";
            if (!("target" in config.compilerOptions)) {
                config.compilerOptions.target = File_1.ScriptTarget[this.context.languageLevel];
            }
            if (tsConfigOverride) {
                config.compilerOptions = Object.assign(config.compilerOptions, tsConfigOverride);
            }
            if (config.compilerOptions.allowSyntheticDefaultImports !== undefined) {
                if (this.context.fuse && this.context.fuse.producer) {
                    this.context.fuse.producer.allowSyntheticDefaultImports = config.compilerOptions.allowSyntheticDefaultImports;
                }
            }
            this.config = config;
            this.defaultSetup();
            if (!configFileFound && this.context.ensureTsConfig === true) {
                this.initializeConfig();
            }
            if (this.context.ensureTsConfig === true) {
                this.verifyTsLib();
            }
            this.context.log.echoInfo(`Typescript script target: ${config.compilerOptions.target}`);
            CACHED[cacheKey] = this.config;
        }
    }
}
exports.TypescriptConfig = TypescriptConfig;
function readConfigFile(configFilePath, rootDir) {
    const res = ts.readConfigFile(configFilePath, ts.sys.readFile);
    if (res.error || !res.config || !res.config.extends)
        return res;
    const extendsFilePath = res.config.extends;
    const parentRes = readConfigFile(path.isAbsolute(extendsFilePath) ? extendsFilePath : path.join(rootDir, extendsFilePath), rootDir);
    if (parentRes.config) {
        const config = { ...res.config };
        delete config.extends;
        res.config = { ...parentRes.config, ...config, compilerOptions: { ...parentRes.config.compilerOptions, ...config.compilerOptions } };
    }
    return res;
}
