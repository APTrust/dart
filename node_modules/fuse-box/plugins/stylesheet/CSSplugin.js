"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const File_1 = require("../../core/File");
const realm_utils_1 = require("realm-utils");
const Utils_1 = require("../../Utils");
const ensureCSSExtension = (file) => {
    let str = file instanceof File_1.File ? file.info.fuseBoxPath : file;
    const ext = path.extname(str);
    if (ext !== ".css") {
        return str.replace(ext, ".css");
    }
    return str;
};
class CSSPluginClass {
    constructor(opts = {}) {
        this.test = /\.css$/;
        this.minify = false;
        this.options = opts;
        if (opts.minify !== undefined) {
            this.minify = opts.minify;
        }
    }
    injectFuseModule(file) {
        file.addStringDependency("fuse-box-css");
    }
    init(context) {
        context.allowExtension(".css");
    }
    getFunction() {
        return `require("fuse-box-css")`;
    }
    inject(file, options, alternative) {
        const resolvedPath = realm_utils_1.utils.isFunction(options.inject)
            ? options.inject(ensureCSSExtension(file))
            : ensureCSSExtension(file);
        const result = options.inject !== false ? `${this.getFunction()}("${resolvedPath}");` : "";
        if (alternative) {
            file.addAlternativeContent(result);
        }
        else {
            file.contents = result;
        }
        return resolvedPath;
    }
    transformGroup(group) {
        const debug = (text) => group.context.debugPlugin(this, text);
        debug(`Start group transformation on "${group.info.fuseBoxPath}"`);
        let concat = new Utils_1.Concat(true, "", "\n");
        group.subFiles.forEach(file => {
            debug(`  -> Concat ${file.info.fuseBoxPath}`);
            concat.add(file.info.fuseBoxPath, file.contents, file.generateCorrectSourceMap());
            file.sourceMap = undefined;
        });
        let options = group.groupHandler.options || {};
        const cssContents = concat.content;
        if (options.outFile) {
            let outFile = Utils_1.ensureUserPath(ensureCSSExtension(options.outFile));
            const bundleDir = path.dirname(outFile);
            const sourceMapsName = path.basename(options.outFile) + ".map";
            concat.add(null, `/*# sourceMappingURL=${sourceMapsName} */`);
            debug(`Writing ${outFile}`);
            return Utils_1.write(outFile, concat.content).then(() => {
                const resolvedPath = this.inject(group, options);
                this.emitHMR(group, resolvedPath);
                const sourceMapsFile = Utils_1.ensureUserPath(path.join(bundleDir, sourceMapsName));
                return Utils_1.write(sourceMapsFile, concat.sourceMap);
            });
        }
        else {
            debug(`Inlining ${group.info.fuseBoxPath}`);
            const safeContents = JSON.stringify(cssContents.toString());
            group.addAlternativeContent(`${this.getFunction()}("${group.info.fuseBoxPath}", ${safeContents});`);
        }
        this.emitHMR(group);
    }
    emitHMR(file, resolvedPath) {
        let emitRequired = false;
        const bundle = file.context.bundle;
        if (bundle && bundle.lastChangedFile) {
            const lastFile = file.context.convertToFuseBoxPath(bundle.lastChangedFile);
            if (Utils_1.isStylesheetExtension(bundle.lastChangedFile)) {
                if (lastFile === file.info.fuseBoxPath ||
                    file.context.getItem("HMR_FILE_REQUIRED", []).indexOf(file.info.fuseBoxPath) > -1) {
                    emitRequired = true;
                }
                if (file.subFiles.find(subFile => subFile.info.fuseBoxPath === bundle.lastChangedFile)) {
                    emitRequired = true;
                }
            }
        }
        if (emitRequired) {
            if (resolvedPath) {
                file.context.sourceChangedEmitter.emit({
                    type: "hosted-css",
                    path: resolvedPath,
                });
            }
            else {
                file.context.sourceChangedEmitter.emit({
                    type: "css",
                    content: file.alternativeContent,
                    path: file.info.fuseBoxPath,
                });
            }
        }
    }
    async transform(file) {
        if (!file.context.sourceMapsProject) {
            file.sourceMap = undefined;
        }
        if (file.hasSubFiles()) {
            return;
        }
        this.injectFuseModule(file);
        const debug = (text) => file.context.debugPlugin(this, text);
        file.loadContents();
        let filePath = file.info.fuseBoxPath;
        let context = file.context;
        file.contents = this.minify ? this.minifyContents(file.contents) : file.contents;
        if (this.options.group) {
            const bundleName = this.options.group;
            let fileGroup = context.getFileGroup(bundleName);
            if (!fileGroup) {
                fileGroup = context.createFileGroup(bundleName, file.collection, this);
            }
            fileGroup.addSubFile(file);
            debug(`  grouping -> ${bundleName}`);
            file.addAlternativeContent(`require("${context.defaultPackageName}/${bundleName}")`);
            return;
        }
        if (typeof file.sourceMap === "string") {
            file.sourceMap = file.generateCorrectSourceMap();
        }
        let outFileFunction;
        if (this.options.outFile !== undefined) {
            if (!realm_utils_1.utils.isFunction(this.options.outFile)) {
                context.fatal(`Error in CSSConfig. outFile is expected to be a function that resolves a path`);
            }
            else {
                outFileFunction = this.options.outFile;
            }
        }
        if (outFileFunction) {
            const userPath = Utils_1.ensureUserPath(outFileFunction(ensureCSSExtension(file)));
            const utouchedPath = outFileFunction(file.info.fuseBoxPath);
            const resolvedPath = this.inject(file, this.options, true);
            return Utils_1.write(userPath, file.contents).then(() => {
                this.emitHMR(file, resolvedPath);
                if (file.sourceMap && file.context.sourceMapsProject) {
                    const fileDir = path.dirname(userPath);
                    const sourceMapPath = path.join(fileDir, path.basename(utouchedPath) + ".map");
                    return Utils_1.write(sourceMapPath, file.sourceMap).then(() => {
                        file.sourceMap = undefined;
                    });
                }
            });
        }
        else {
            if (file.sourceMap && file.context.useSourceMaps) {
                file.generateInlinedCSS();
            }
            let safeContents = JSON.stringify(file.contents);
            file.sourceMap = undefined;
            const fullPath = `${(file.collection && file.collection.name) || "default"}/${filePath}`;
            file.addAlternativeContent(`${this.getFunction()}("${fullPath}", ${safeContents})`);
            this.emitHMR(file);
        }
    }
    minifyContents(contents) {
        return contents
            .replace(/\s{2,}/g, " ")
            .replace(/\t|\r|\n/g, "")
            .trim();
    }
}
exports.CSSPluginClass = CSSPluginClass;
exports.CSSPlugin = (opts) => {
    return new CSSPluginClass(opts);
};
