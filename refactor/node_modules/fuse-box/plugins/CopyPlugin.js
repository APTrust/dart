"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
const Utils_1 = require("../Utils");
const fs = require("fs-extra");
const path = require("path");
class CopyPluginClass {
    constructor(options = {}) {
        this.options = options;
        this.test = /.*/;
        this.useDefault = true;
        this.resolve = "/assets/";
        this.dest = "assets";
        options = options || {};
        if (options.useDefault !== undefined) {
            this.useDefault = options.useDefault;
        }
        if (options.resolve !== undefined) {
            this.resolve = options.resolve;
        }
        if (options.dest !== undefined) {
            this.dest = options.dest;
        }
        if (realm_utils_1.utils.isArray(options.files)) {
            this.extensions = [];
            options.files.forEach(str => {
                this.extensions.push("." + Utils_1.extractExtension(str));
            });
            this.test = Utils_1.string2RegExp(options.files.join("|"));
        }
    }
    init(context) {
        if (Array.isArray(this.extensions)) {
            return this.extensions.forEach(ext => context.allowExtension(ext));
        }
    }
    transform(file) {
        const context = file.context;
        file.isLoaded = true;
        let userFile = (!context.hash ? Utils_1.hashString(file.info.fuseBoxPath) + "-" : "") + path.basename(file.info.fuseBoxPath);
        let userPath = path.join(this.dest, userFile);
        let exportsKey = this.useDefault ? "module.exports.default" : "module.exports";
        file.alternativeContent = `${exportsKey} = "${Utils_1.joinFuseBoxPath(this.resolve, userFile)}";`;
        if (fs.existsSync(userPath)) {
            return;
        }
        return new Promise((resolve, reject) => {
            fs.readFile(file.absPath, (err, data) => {
                if (err) {
                    return reject();
                }
                return context.output
                    .writeToOutputFolder(userPath, data, true)
                    .then(result => {
                    if (result.hash) {
                        file.alternativeContent = `${exportsKey} = "${Utils_1.joinFuseBoxPath(this.resolve, result.filename)}";`;
                    }
                    return resolve();
                })
                    .catch(reject);
            });
        });
    }
}
exports.CopyPluginClass = CopyPluginClass;
exports.CopyPlugin = (options) => {
    return new CopyPluginClass(options);
};
