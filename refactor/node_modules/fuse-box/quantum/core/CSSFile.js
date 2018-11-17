"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CSSFile {
    constructor(name, contents, packageName = "default") {
        this.name = name;
        this.contents = contents;
        this.packageName = packageName;
    }
}
exports.CSSFile = CSSFile;
