"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../Utils");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const shortHash = require("shorthash");
class UserOutputResult {
}
exports.UserOutputResult = UserOutputResult;
class UserOutput {
    constructor(context, original) {
        this.context = context;
        this.original = original;
        this.filename = "bundle.js";
        this.useHash = false;
        this.setup();
    }
    setName(name) {
        this.filename = name;
        const split = name.split("/");
        if (split.length > 1) {
            this.folderFromBundleName = split.splice(0, split.length - 1).join("/");
        }
    }
    getUniqueHash() {
        return `${shortHash.unique(this.original)}-${encodeURIComponent(this.filename)}`;
    }
    setup() {
        if (this.original.indexOf("$name") === -1) {
            this.filename = path.basename(this.original);
            this.original = this.original.replace(this.filename, "$name");
        }
        const dir = path.dirname(this.original);
        this.template = path.basename(this.original);
        this.dir = Utils_1.ensureDir(dir);
        this.useHash = this.context.isHashingRequired();
    }
    read(fname) {
        return new Promise((resolve, reject) => {
            fs.readFile(fname, (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data.toString());
            });
        });
    }
    generateHash(content) {
        return Utils_1.hashString(crypto
            .createHash("md5")
            .update(content, "utf8")
            .digest("hex"));
    }
    getPath(str, hash) {
        let template = this.template;
        const userExt = path.extname(str);
        const templateExt = path.extname(template);
        if (userExt && templateExt) {
            if (userExt === ".js" || userExt === ".html") {
                template = template.replace(templateExt, "");
            }
        }
        let basename = path.basename(str);
        let dirname = path.dirname(str);
        let fname;
        if (hash) {
            if (template.indexOf("$hash") === -1) {
                fname = template.replace("$name", hash + "-" + basename);
            }
            else {
                fname = template.replace("$name", basename).replace("$hash", hash);
            }
        }
        else {
            fname = template.replace("$name", basename).replace(/([-_]*\$hash[-_]*)/, "");
        }
        this.lastGeneratedFileName = fname;
        let result = path.join(this.dir, dirname, fname);
        return result;
    }
    getBundlePath() { }
    writeManifest(obj) {
        let fullpath = this.getPath(`${this.context.bundle.name}.manifest.json`);
        fullpath = Utils_1.ensureUserPath(fullpath);
        fs.writeFileSync(fullpath, JSON.stringify(obj, null, 2));
    }
    getManifest() {
        let fullpath = this.getPath(`${this.context.bundle.name}.manifest.json`);
        if (fs.existsSync(fullpath)) {
            return require(fullpath);
        }
    }
    writeToOutputFolder(userPath, content, hashAllowed = false) {
        let targetPath = path.join(this.dir, userPath);
        Utils_1.ensureUserPath(targetPath);
        let hash;
        if (this.useHash && hashAllowed) {
            hash = this.generateHash(content.toString());
            let fileName = `${hash}-${path.basename(targetPath)}`;
            let dirName = path.dirname(targetPath);
            targetPath = path.join(dirName, fileName);
            this.lastWrittenHash = hash;
        }
        return new Promise((resolve, reject) => {
            fs.writeFile(targetPath, content, e => {
                if (e) {
                    return reject(e);
                }
                let result = new UserOutputResult();
                result.content = content;
                result.hash = hash;
                result.path = targetPath;
                result.filename = path.basename(targetPath);
                return resolve(result);
            });
        });
    }
    write(userPath, content, ignoreHash) {
        let hash;
        if (this.useHash) {
            hash = this.generateHash(content.toString());
            this.lastWrittenHash = hash;
        }
        let fullpath = this.getPath(userPath, !ignoreHash ? hash : undefined);
        fullpath = Utils_1.ensureUserPath(fullpath);
        let result = new UserOutputResult();
        return new Promise((resolve, reject) => {
            result.path = fullpath;
            result.hash = hash;
            result.filename = path.basename(fullpath);
            result.relativePath = Utils_1.joinFuseBoxPath(this.folderFromBundleName || ".", result.filename);
            this.lastWrittenPath = fullpath;
            if (this.context.userWriteBundles) {
                fs.writeFile(fullpath, content, e => {
                    if (e) {
                        return reject(e);
                    }
                    return resolve(result);
                });
            }
            else {
                result.content = content;
                return resolve(result);
            }
        });
    }
    writeCurrent(content) {
        return this.write(this.filename, content).then(out => {
            this.lastPrimaryOutput = out;
            return out;
        });
    }
}
exports.UserOutput = UserOutput;
