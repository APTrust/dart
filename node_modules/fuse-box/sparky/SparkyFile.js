"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const Mustache = require("mustache");
const Utils_1 = require("../Utils");
const Config_1 = require("../Config");
class SparkyFile {
    constructor(filepath, root) {
        this.savingRequired = false;
        this.filepath = path.normalize(filepath);
        this.root = path.normalize(root);
        let hp = path.relative(this.root, this.filepath);
        this.homePath = path.isAbsolute(hp) ? hp.slice(1) : hp;
        this.name = path.basename(this.filepath);
    }
    read() {
        this.contents = fs.readFileSync(this.filepath);
        return this;
    }
    write(contents) {
        this.contents = contents;
        fs.writeFileSync(this.filepath, contents);
        return this;
    }
    template(obj) {
        if (!this.contents) {
            this.read();
        }
        this.contents = Mustache.render(this.contents.toString(), obj);
        this.savingRequired = true;
    }
    save() {
        this.savingRequired = false;
        if (this.contents) {
            let contents = this.contents;
            if (typeof this.contents === "object") {
                this.contents = JSON.stringify(contents, null, 2);
            }
            Utils_1.ensureDir(path.dirname(this.filepath));
            fs.writeFileSync(this.filepath, this.contents);
        }
        return this;
    }
    ext(ext) {
        this.extension = ext;
        return this;
    }
    json(fn) {
        if (!this.contents) {
            this.read();
        }
        if (typeof fn === "function") {
            let contents = this.contents.toString() ? JSON.parse(this.contents.toString()) : {};
            const response = fn(contents);
            this.contents = response ? response : contents;
            this.savingRequired = true;
        }
        return this;
    }
    plugin(plugin) {
        if (!this.contents) {
            this.read();
        }
    }
    setContent(cnt) {
        this.contents = cnt;
        this.savingRequired = true;
        return this;
    }
    rename(name) {
        this.name = name;
        return this;
    }
    copy(dest) {
        return new Promise((resolve, reject) => {
            const isDirectory = fs.statSync(this.filepath).isDirectory();
            if (isDirectory) {
                return resolve();
            }
            const isTemplate = dest.indexOf("$") > -1;
            if (isTemplate) {
                if (!path.isAbsolute(dest)) {
                    dest = path.join(Config_1.Config.PROJECT_ROOT, dest);
                }
                dest = dest.replace("$name", this.name).replace("$path", this.filepath);
            }
            else {
                dest = path.join(dest, this.homePath);
                dest = Utils_1.ensureUserPath(dest);
            }
            if (this.extension) {
                dest = Utils_1.replaceExt(dest, "." + this.extension);
                delete this.extension;
            }
            fs.copy(this.filepath, dest, err => {
                if (err)
                    return reject(err);
                this.filepath = dest;
                if (this.savingRequired) {
                    this.save();
                }
                return resolve();
            });
        });
    }
}
exports.SparkyFile = SparkyFile;
