"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Config_1 = require("../Config");
function parse(str, opts) {
    const base = opts ? opts.base || "" : "";
    const isGlob = /[*{}}]/.test(str);
    const isAbsolutePath = path.isAbsolute(str);
    let root, filepath, glob;
    if (!isGlob) {
        root = isAbsolutePath ? path.dirname(str) : path.join(Config_1.Config.PROJECT_ROOT, base);
        filepath = isAbsolutePath ? path.normalize(str) : path.join(Config_1.Config.PROJECT_ROOT, base, str);
    }
    else {
        if (isAbsolutePath) {
            root = path.normalize(str.split("*")[0]);
            glob = path.normalize(str);
        }
        else {
            glob = path.join(Config_1.Config.PROJECT_ROOT, base, str);
            root = path.join(Config_1.Config.PROJECT_ROOT, base);
        }
    }
    return {
        isGlob: isGlob,
        root: root,
        glob: glob,
        filepath: filepath,
    };
}
exports.parse = parse;
