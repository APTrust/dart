"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const SVG2Base64_1 = require("../../lib/SVG2Base64");
const base64Img = require("base64-img");
class ImageBase64PluginClass {
    constructor(opts) {
        this.test = /\.(gif|png|jpg|jpeg|svg)$/i;
        this.opts = opts || {};
    }
    init(context) {
        context.allowExtension(".gif");
        context.allowExtension(".png");
        context.allowExtension(".jpg");
        context.allowExtension(".jpeg");
        context.allowExtension(".svg");
    }
    transform(file) {
        const context = file.context;
        if (context.useCache) {
            const cached = context.cache.getStaticCache(file);
            if (cached) {
                file.isLoaded = true;
                file.contents = cached.contents;
                return;
            }
        }
        const exportsKey = this.opts.useDefault ? "module.exports.default" : "module.exports";
        const ext = path.extname(file.absPath);
        if (ext === ".svg") {
            file.loadContents();
            const content = SVG2Base64_1.SVG2Base64.get(file.contents);
            file.contents = `${exportsKey} = ${JSON.stringify(content)}`;
            return;
        }
        file.isLoaded = true;
        const data = base64Img.base64Sync(file.absPath);
        file.contents = `${exportsKey} = ${JSON.stringify(data)}`;
        if (context.useCache) {
            context.cache.writeStaticCache(file, undefined);
        }
    }
}
exports.ImageBase64PluginClass = ImageBase64PluginClass;
exports.ImageBase64Plugin = (opts) => {
    return new ImageBase64PluginClass(opts);
};
