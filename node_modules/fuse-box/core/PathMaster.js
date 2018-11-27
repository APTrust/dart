"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../Utils");
const Config_1 = require("../Config");
const path = require("path");
const fs = require("fs");
const NODE_MODULE = /^([a-z@](?!:).*)$/;
const isRelative = /^[\.\/\\]+$/;
const jsExtensions = ["js", "jsx"];
const tsExtensions = jsExtensions.concat(["ts", "tsx"]);
class AllowedExtensions {
    static add(name) {
        if (!this.list.has(name)) {
            this.list.add(name);
        }
    }
    static has(name) {
        return this.list.has(name);
    }
}
AllowedExtensions.list = new Set([".js", ".jsx", ".ts", ".tsx", ".json", ".xml", ".css", ".html"]);
exports.AllowedExtensions = AllowedExtensions;
class PathMaster {
    constructor(context, rootPackagePath) {
        this.context = context;
        this.rootPackagePath = rootPackagePath;
        this.tsMode = false;
    }
    init(name, fuseBoxPath) {
        const resolved = this.resolve(name, this.rootPackagePath);
        if (fuseBoxPath) {
            resolved.fuseBoxPath = fuseBoxPath;
        }
        return resolved;
    }
    setTypeScriptMode() {
        this.tsMode = true;
    }
    resolve(name, root, rootEntryLimit, parent) {
        let data = {};
        if (/^(http(s)?:|\/\/)/.test(name)) {
            data.isRemoteFile = true;
            data.remoteURL = name;
            data.absPath = name;
            return data;
        }
        data.isNodeModule = NODE_MODULE.test(name);
        if (data.isNodeModule) {
            let info = this.getNodeModuleInfo(name);
            data.nodeModuleName = info.name;
            let nodeModuleInfo = this.getNodeModuleInformation(info.name);
            let cachedInfo = this.context.getLibInfo(nodeModuleInfo.name, nodeModuleInfo.version);
            if (cachedInfo) {
                data.nodeModuleInfo = cachedInfo;
            }
            else {
                data.nodeModuleInfo = nodeModuleInfo;
                this.context.setLibInfo(nodeModuleInfo.name, nodeModuleInfo.version, nodeModuleInfo);
            }
            if (info.target) {
                const absPath = this.getAbsolutePath(info.target, data.nodeModuleInfo.root, undefined, true);
                if (absPath.alias) {
                    if (parent) {
                        parent.analysis.replaceAliases(new Set([{ from: name, to: info.name + "/" + absPath.alias }]));
                    }
                    data.fuseBoxAlias = absPath.alias;
                }
                data.absPath = absPath.resolved;
                data.absDir = path.dirname(data.absPath);
                data.nodeModuleExplicitOriginal = info.target;
            }
            else {
                data.absPath = data.nodeModuleInfo.entry;
                data.absDir = data.nodeModuleInfo.root;
            }
            if (data.absPath) {
                data.fuseBoxPath = this.getFuseBoxPath(data.absPath, data.nodeModuleInfo.root);
            }
            if (this.fuseBoxAlias) {
                data.fuseBoxPath = this.fuseBoxAlias;
            }
        }
        else {
            if (root) {
                const absPath = this.getAbsolutePath(name, root, rootEntryLimit);
                if (absPath.alias) {
                    data.fuseBoxAlias = absPath.alias;
                    if (parent) {
                        parent.analysis.replaceAliases(new Set([{ from: name, to: `~/` + absPath.alias }]));
                    }
                }
                data.absPath = absPath.resolved;
                data.absDir = path.dirname(data.absPath);
                data.fuseBoxPath = this.getFuseBoxPath(data.absPath, this.rootPackagePath);
                if (path.relative(this.rootPackagePath, data.absPath).match(/^\.\.(\\|\/)/)) {
                    this.context.fuse.producer.addWarning("unresolved", `File "${data.absPath}" cannot be bundled because it's out of your project directory (homeDir)`);
                }
            }
        }
        if (data.fuseBoxAlias) {
            data.overrideStatement = { key: name, value: data.fuseBoxAlias };
        }
        return data;
    }
    getFuseBoxPath(name, root) {
        if (!root) {
            return;
        }
        name = name.replace(/\\/g, "/");
        root = root.replace(/\\/g, "/");
        name = name.replace(root, "").replace(/^\/|\\/, "");
        name = Utils_1.ensurePublicExtension(name);
        let ext = path.extname(name);
        if (!ext) {
            name += ".js";
        }
        return name;
    }
    getAbsolutePath(name, root, rootEntryLimit, explicit = false) {
        const data = this.ensureFolderAndExtensions(name, root, explicit);
        const url = data.resolved;
        const alias = data.alias;
        let result = path.resolve(root, url);
        if (rootEntryLimit && name.match(/\.\.\/$/)) {
            if (result.indexOf(path.dirname(rootEntryLimit)) < 0) {
                return { resolved: rootEntryLimit, alias: alias };
            }
        }
        const output = { resolved: result, alias: alias };
        return output;
    }
    getParentFolderName() {
        if (this.rootPackagePath) {
            let s = this.rootPackagePath.split(/\/|\\/g);
            return s[s.length - 1];
        }
        return "";
    }
    testFolder(folder, name) {
        let extensions = jsExtensions;
        if (this.tsMode || this.context.useTypescriptCompiler) {
            extensions = tsExtensions;
        }
        if (fs.existsSync(folder)) {
            for (let i = 0; i < extensions.length; i++) {
                const index = "index." + extensions[i];
                if (fs.existsSync(path.join(folder, index))) {
                    const result = path.join(name, index);
                    const [a, b] = name;
                    if (a === "." && b !== ".") {
                        return "./" + result;
                    }
                    return result;
                }
            }
        }
    }
    checkFileName(root, name) {
        let extensions = jsExtensions;
        if (this.tsMode || this.context.useTypescriptCompiler) {
            extensions = tsExtensions;
        }
        for (let i = 0; i < extensions.length; i++) {
            let ext = extensions[i];
            let fileName = `${name}.${ext}`;
            let target = path.isAbsolute(name) ? fileName : path.join(root, fileName);
            if (fs.existsSync(target)) {
                if (fileName[0] === ".") {
                    fileName = `./${fileName}`;
                }
                return fileName;
            }
        }
    }
    ensureNodeModuleExtension(input) {
        let ext = path.extname(input);
        if (!ext && !isRelative.test(input)) {
            return input + ".js";
        }
        return input;
    }
    extractRelativeFuseBoxPath(root, target) {
        root = Utils_1.ensureFuseBoxPath(root);
        target = Utils_1.ensureFuseBoxPath(target);
        const sResult = target.split(root);
        if (sResult[1]) {
            let fusePath = sResult[1];
            if (fusePath[0] === "/") {
                fusePath = fusePath.slice(1);
            }
            return this.ensureNodeModuleExtension(fusePath);
        }
    }
    ensureFolderAndExtensions(name, root, explicit = false) {
        let ext = path.extname(name);
        if (ext === ".ts") {
            this.tsMode = true;
        }
        let fileExt = this.tsMode || (this.context.useTypescriptCompiler && !explicit) ? ".ts" : ".js";
        if (name[0] === "~" && name[1] === "/" && this.rootPackagePath) {
            name = "." + name.slice(1, name.length);
            name = path.join(this.rootPackagePath, name);
        }
        if (!ext) {
            const folderJsonPath = path.join(root, name, "package.json");
            if (fs.existsSync(folderJsonPath)) {
                const folderJSON = require(folderJsonPath);
                if (folderJSON.main) {
                    const resolved = path.resolve(root, name, folderJSON.main);
                    const opts = {
                        resolved: resolved,
                        alias: this.extractRelativeFuseBoxPath(root, resolved),
                    };
                    return opts;
                }
            }
        }
        if (!AllowedExtensions.has(ext)) {
            let fileNameCheck = this.checkFileName(root, name);
            if (fileNameCheck) {
                return { resolved: fileNameCheck };
            }
            else {
                let folder = path.isAbsolute(name) ? name : path.join(root, name);
                const folderPath = this.testFolder(folder, name);
                if (folderPath) {
                    return { resolved: folderPath };
                }
                else {
                    name += fileExt;
                    return { resolved: name };
                }
            }
        }
        return { resolved: name };
    }
    getNodeModuleInfo(name) {
        if (name[0] === "@") {
            let s = name.split("/");
            let target = s.splice(2, s.length).join("/");
            return {
                name: `${s[0]}/${s[1]}`,
                target: target,
            };
        }
        let data = name.split(/\/(.+)?/);
        return {
            name: data[0],
            target: data[1],
        };
    }
    fixBrowserOverrides(browserOverrides) {
        let newOverrides = {};
        for (let key in browserOverrides) {
            let value = browserOverrides[key];
            if (typeof value === "string") {
                if (/^[a-z]/.test(value) && !/.js$/.test(value)) {
                    value = value;
                }
                else {
                    if (/\.\//.test(key)) {
                        key = key.slice(2);
                    }
                    if (/\.\//.test(value)) {
                        value = "~/" + value.slice(2);
                    }
                    else {
                        value = "~/" + value;
                    }
                    if (!/.js$/.test(value)) {
                        value = value + ".js";
                    }
                }
            }
            newOverrides[key] = value;
        }
        return newOverrides;
    }
    getNodeModuleInformation(name) {
        const readMainFile = (folder, isCustom) => {
            const packageJSONPath = path.join(folder, "package.json");
            if (fs.existsSync(packageJSONPath)) {
                const json = require(packageJSONPath);
                let entryFile;
                let entryRoot;
                let jsNext = false;
                let browserOverrides;
                if (this.context.target !== "server" && this.context.target !== "electron") {
                    if (json.browser && !this.context.isBrowserTarget()) {
                        this.context.fuse.producer.addWarning("json.browser", `Library "${name}" contains "browser" field. Set .target("browser") to avoid problems with your browser build!`);
                    }
                }
                if (this.context.isBrowserTarget() && json.browser) {
                    if (typeof json.browser === "object") {
                        browserOverrides = this.fixBrowserOverrides(json.browser);
                        if (json.browser[json.main]) {
                            entryFile = json.browser[json.main];
                        }
                    }
                    if (typeof json.browser === "string") {
                        entryFile = json.browser;
                    }
                }
                if (this.context.shouldUseJsNext(name) && (json["jsnext:main"] || json.module)) {
                    jsNext = true;
                    entryFile = path.join(folder, json["jsnext:main"] || json.module);
                }
                else {
                    entryFile = path.join(folder, entryFile || json.main || "index.js");
                }
                if (json["ts:main"]) {
                    entryFile = json["ts:main"];
                    if (entryFile[0] !== ".") {
                        entryFile = `./${entryFile}`;
                    }
                }
                entryRoot = path.dirname(entryFile);
                const ext = path.extname(entryFile);
                return {
                    browserOverrides: browserOverrides,
                    name,
                    tsMode: ext === ".ts",
                    jsNext,
                    custom: isCustom,
                    root: folder,
                    missing: false,
                    entryRoot,
                    entry: entryFile,
                    version: json.version || "1.0.0",
                };
            }
            let defaultEntry = path.join(folder, "index.js");
            let entryFile = fs.existsSync(defaultEntry) ? defaultEntry : undefined;
            let defaultEntryRoot = entryFile ? path.dirname(entryFile) : undefined;
            let packageExists = fs.existsSync(folder);
            return {
                name,
                missing: !packageExists,
                custom: isCustom,
                root: folder,
                entry: entryFile,
                entryRoot: defaultEntryRoot,
                version: "0.0.0",
            };
        };
        let localLib = path.join(Config_1.Config.FUSEBOX_MODULES, name);
        let modulePath = path.join(Config_1.Config.NODE_MODULES_DIR, name);
        const producer = this.context.bundle && this.context.bundle.producer;
        if (producer && producer.isShared(name)) {
            let shared = producer.getSharedPackage(name);
            return {
                name,
                custom: false,
                bundleData: shared.data,
                root: shared.homeDir,
                entry: shared.mainPath,
                entryRoot: shared.mainDir,
                version: "0.0.0",
            };
        }
        const customModulesFolder = this.context.customModulesFolder;
        if (customModulesFolder) {
            for (const customModulesFolderItem of customModulesFolder) {
                const customFolder = path.join(customModulesFolderItem, name);
                if (fs.existsSync(customFolder)) {
                    return readMainFile(customFolder, false);
                }
            }
        }
        if (fs.existsSync(localLib)) {
            return readMainFile(localLib, false);
        }
        if (this.rootPackagePath) {
            let nodeModules = path.join(this.rootPackagePath, "node_modules");
            let nestedNodeModule = path.join(nodeModules, name);
            if (fs.existsSync(nestedNodeModule)) {
                return readMainFile(nestedNodeModule, nodeModules !== Config_1.Config.NODE_MODULES_DIR);
            }
            else {
                let upperNodeModule = path.join(this.rootPackagePath, "../", name);
                if (path.dirname(upperNodeModule) !== Config_1.Config.NODE_MODULES_DIR) {
                    if (fs.existsSync(upperNodeModule)) {
                        let isCustom = false;
                        if (path.dirname(upperNodeModule).match(/node_modules$/)) {
                            isCustom = path.dirname(this.rootPackagePath) !== Config_1.Config.NODE_MODULES_DIR;
                            return readMainFile(upperNodeModule, isCustom);
                        }
                    }
                }
            }
        }
        return readMainFile(modulePath, false);
    }
}
exports.PathMaster = PathMaster;
