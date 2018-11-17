"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../../Utils");
class CSSCollection {
    constructor(core) {
        this.core = core;
        this.collection = new Set();
        this.useSourceMaps = false;
    }
    add(css) {
        this.collection.add(css);
    }
    render(fileName) {
        this.renderedFileName = fileName;
        const producer = this.core.producer;
        const concat = new Utils_1.Concat(true, fileName, "\n");
        this.collection.forEach(file => {
            this.core.log.echoInfo(`CSS: Grouping inlined css ${file.name} into ${this.renderedFileName}`);
            const sourceMaps = producer.sharedSourceMaps.get(file.name);
            const contents = file.contents.replace(/\/*#\s*sourceMappingURL=\s*([^\s]+)\s*\*\//, "");
            concat.add(null, `/* ${file.name} */`);
            if (sourceMaps) {
                this.useSourceMaps = true;
                concat.add(file.name, contents, sourceMaps);
            }
            else {
                concat.add(null, contents);
            }
        });
        if (this.useSourceMaps) {
            this.sourceMapsPath = Utils_1.joinFuseBoxPath("/", `${this.renderedFileName}.map`);
            concat.add(null, `/*# sourceMappingURL=${this.sourceMapsPath} */`);
        }
        this.sourceMap = concat.sourceMap;
        this.renderedString = concat.content.toString();
        return this.renderedString;
    }
    getString() {
        return this.renderedString;
    }
    setString(str) {
        if (this.useSourceMaps) {
            str += "\n/*# sourceMappingURL=" + this.sourceMapsPath + " */";
        }
        this.renderedString = str;
        return str;
    }
}
exports.CSSCollection = CSSCollection;
