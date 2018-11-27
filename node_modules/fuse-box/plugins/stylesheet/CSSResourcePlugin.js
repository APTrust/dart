"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../../Utils");
const path = require("path");
const realm_utils_1 = require("realm-utils");
const fs = require("fs");
const SVG2Base64_1 = require("../../lib/SVG2Base64");
const CSSUrlParser_1 = require("../../lib/CSSUrlParser");
const base64Img = require("base64-img");
const IMG_CACHE = {};
let resourceFolderChecked = false;
const copyFile = (source, target) => {
    return new Promise((resolve, reject) => {
        fs.exists(source, exists => {
            if (!exists) {
                return resolve();
            }
            let rd = fs.createReadStream(source);
            rd.on("error", err => {
                return reject(err);
            });
            Utils_1.ensureDir(path.dirname(target));
            let wr = fs.createWriteStream(target);
            wr.on("error", err => {
                return reject(err);
            });
            wr.on("close", ex => {
                return resolve();
            });
            rd.pipe(wr);
        });
    });
};
const generateNewFileName = (str) => {
    let s = str.split("node_modules");
    const ext = path.extname(str);
    if (s[1]) {
        str = s[1];
    }
    let hash = 0;
    let i;
    let chr;
    let len;
    if (str.length === 0) {
        return hash.toString() + ext;
    }
    for (i = 0, len = str.length; i < len; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    let fname = hash.toString() + ext;
    if (fname.charAt(0) === "-") {
        fname = "_" + fname.slice(1);
    }
    return fname;
};
class CSSResourcePluginClass {
    constructor(opts = {}) {
        this.test = /\.css$/;
        this.useOriginalFilenames = false;
        this.files = {};
        this.copiedFiles = [];
        this.filesMappingNeedsToTrigger = false;
        this.resolveFn = p => Utils_1.joinFuseBoxPath("/css-resources", p);
        if (opts.dist) {
            this.distFolder = Utils_1.ensureDir(opts.dist);
        }
        if (opts.inline) {
            this.inlineImages = opts.inline;
        }
        if (opts.macros) {
            this.macros = opts.macros;
        }
        if (realm_utils_1.utils.isFunction(opts.resolve)) {
            this.resolveFn = opts.resolve;
        }
        if (realm_utils_1.utils.isFunction(opts.resolveMissing)) {
            this.resolveMissingFn = opts.resolveMissing;
        }
        if (opts.useOriginalFilenames) {
            this.useOriginalFilenames = opts.useOriginalFilenames;
        }
        if (opts.filesMapping) {
            this.filesMapping = opts.filesMapping;
        }
    }
    init(context) {
        context.allowExtension(".css");
    }
    createResourceFolder(file) {
        if (resourceFolderChecked === false) {
            resourceFolderChecked = true;
            if (this.distFolder) {
                return;
            }
            this.distFolder = Utils_1.ensureDir(path.join(file.context.output.dir, "css-resources"));
        }
    }
    transform(file) {
        file.addStringDependency("fuse-box-css");
        file.loadContents();
        if (this.distFolder) {
            this.createResourceFolder(file);
        }
        const currentFolder = file.info.absDir;
        const tasks = [];
        const walker = url => {
            if (this.macros) {
                for (let key in this.macros) {
                    url = url.replace("$" + key, this.macros[key]);
                }
            }
            if (url.startsWith("https:") || url.startsWith("http:") || url.startsWith("//") || url.startsWith("#")) {
                return url;
            }
            let urlFile = path.isAbsolute(url) ? url : path.resolve(currentFolder, url);
            urlFile = urlFile.replace(/[?\#].*$/, "");
            if (file.context.extensionOverrides && file.belongsToProject()) {
                urlFile = file.context.extensionOverrides.getPathOverride(urlFile) || urlFile;
            }
            if (this.inlineImages) {
                if (IMG_CACHE[urlFile]) {
                    return IMG_CACHE[urlFile];
                }
                if (!fs.existsSync(urlFile)) {
                    if (this.resolveMissingFn) {
                        urlFile = this.resolveMissingFn(urlFile, this);
                        if (!urlFile || !fs.existsSync(urlFile)) {
                            file.context.debug("CSSResourcePlugin", `Can't find (resolved) file ${urlFile}`);
                            return;
                        }
                    }
                    else {
                        file.context.debug("CSSResourcePlugin", `Can't find file ${urlFile}`);
                        return;
                    }
                }
                const ext = path.extname(urlFile);
                let fontsExtensions = {
                    ".woff": "application/font-woff",
                    ".woff2": "application/font-woff2",
                    ".eot": "application/vnd.ms-fontobject",
                    ".ttf": "application/x-font-ttf",
                    ".otf": "font/opentype",
                };
                if (fontsExtensions[ext]) {
                    let content = new Buffer(fs.readFileSync(urlFile)).toString("base64");
                    return `data:${fontsExtensions[ext]};charset=utf-8;base64,${content}`;
                }
                if (ext === ".svg") {
                    let content = SVG2Base64_1.SVG2Base64.get(fs.readFileSync(urlFile).toString());
                    IMG_CACHE[urlFile] = content;
                    return content;
                }
                let result = base64Img.base64Sync(urlFile);
                IMG_CACHE[urlFile] = result;
                return result;
            }
            if (this.distFolder) {
                const relativeUrlFile = path.relative(file.context.homeDir, urlFile);
                let newFileName = this.useOriginalFilenames
                    ? relativeUrlFile
                    : generateNewFileName(relativeUrlFile);
                if (!this.files[urlFile]) {
                    let newPath = path.join(this.distFolder, newFileName);
                    tasks.push(copyFile(urlFile, newPath));
                    this.files[urlFile] = true;
                    this.copiedFiles.push({
                        from: urlFile,
                        to: newPath,
                    });
                    this.filesMappingNeedsToTrigger = true;
                }
                return this.resolveFn(newFileName);
            }
        };
        file.contents = CSSUrlParser_1.CSSUrlParser.walk(file.contents, walker);
    }
    bundleEnd(producer) {
        if (!this.filesMapping)
            return;
        if (!this.filesMappingNeedsToTrigger)
            return;
        this.filesMappingNeedsToTrigger = false;
        const homeDir = producer.fuse.opts.homeDir;
        this.filesMapping(this.copiedFiles.map(fileMapping => ({
            from: path.relative(homeDir, fileMapping.from),
            to: path.relative(this.distFolder, fileMapping.to),
        })));
    }
}
exports.CSSResourcePluginClass = CSSResourcePluginClass;
exports.CSSResourcePlugin = (options) => {
    return new CSSResourcePluginClass(options);
};
