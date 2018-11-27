"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConcatPluginClass {
    constructor(opts = {}) {
        this.delimiter = "\n";
        this.test = /\.txt$/;
        if (opts.ext) {
            this.ext = opts.ext;
        }
        if (opts.name) {
            this.bundleName = opts.name;
        }
        if (opts.delimiter) {
            this.delimiter = opts.delimiter;
        }
    }
    init(context) {
        if (this.ext) {
            context.allowExtension(this.ext);
        }
    }
    transform(file) {
        file.loadContents();
        let context = file.context;
        let fileGroup = context.getFileGroup(this.bundleName);
        if (!fileGroup) {
            fileGroup = context.createFileGroup(this.bundleName, file.collection, this);
        }
        fileGroup.addSubFile(file);
        file.alternativeContent = `module.exports = require("./${this.bundleName}")`;
    }
    transformGroup(group) {
        let contents = [];
        group.subFiles.forEach(file => {
            contents.push(file.contents);
        });
        let text = contents.join(this.delimiter);
        group.contents = `module.exports = ${JSON.stringify(text)}`;
    }
}
exports.ConcatPluginClass = ConcatPluginClass;
exports.ConcatPlugin = (options) => {
    return new ConcatPluginClass(options);
};
