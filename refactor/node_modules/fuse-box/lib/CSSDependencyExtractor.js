"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
class CSSDependencyExtractor {
    constructor(opts) {
        this.opts = opts;
        this.filesProcessed = new Set();
        this.dependencies = [];
        this.extractDepsFromString(opts.content);
    }
    extractDepsFromString(input, currentPath) {
        const re = /@(?:import|value)[^"']+["']([^"']+)/g;
        let match;
        while ((match = re.exec(input))) {
            let target = this.findTarget(match[1], currentPath);
            if (target) {
                this.readFile(target, path.dirname(target));
                this.dependencies.push(target);
            }
        }
    }
    readFile(fileName, currentPath) {
        if (!this.filesProcessed.has(fileName)) {
            this.filesProcessed.add(fileName);
            const contents = fs.readFileSync(fileName).toString();
            this.extractDepsFromString(contents, currentPath);
        }
    }
    getDependencies() {
        return this.dependencies;
    }
    tryFile(filePath) {
        if (!filePath) {
            return;
        }
        if (filePath.indexOf("node_modules") > -1) {
            return;
        }
        let fname = path.basename(filePath);
        if (this.opts.sassStyle && !/^_/.test(fname)) {
            const pathWithUnderScore = path.join(path.dirname(filePath), "_" + fname);
            if (fs.existsSync(pathWithUnderScore)) {
                return pathWithUnderScore;
            }
        }
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }
    getPath(suggested, fileName) {
        let target = fileName;
        if (this.opts.importer) {
            fileName = this.opts.importer(fileName, null, info => {
                target = info.file;
            });
        }
        if (!target) {
            return;
        }
        if (path.isAbsolute(target)) {
            return target;
        }
        return path.join(suggested, target);
    }
    findTarget(fileName, currentPath) {
        let targetFile;
        let extName = path.extname(fileName);
        let paths = this.opts.paths;
        if (currentPath) {
            paths = [currentPath].concat(paths);
        }
        if (!extName) {
            for (let p = 0; p < paths.length; p++) {
                for (let e = 0; e < this.opts.extensions.length; e++) {
                    let filePath = this.getPath(paths[p], fileName + "." + this.opts.extensions[e]);
                    filePath = this.tryFile(filePath);
                    if (filePath) {
                        return filePath;
                    }
                }
            }
        }
        else {
            for (let p = 0; p < paths.length; p++) {
                let filePath = this.getPath(paths[p], fileName);
                filePath = this.tryFile(filePath);
                if (filePath) {
                    return filePath;
                }
            }
        }
        return targetFile;
    }
    static init(opts) {
        return new CSSDependencyExtractor(opts);
    }
}
exports.CSSDependencyExtractor = CSSDependencyExtractor;
