"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let marked;
class FuseBoxMarkdownPlugin {
    constructor(opts = {}) {
        this.useDefault = true;
        this.options = {
            gfm: true,
            tables: true,
            breaks: false,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: false,
        };
        this.test = /\.md$/;
        if (opts.useDefault !== undefined) {
            this.useDefault = opts.useDefault;
        }
        this.options = Object.assign(this.options, opts);
    }
    init(context) {
        context.allowExtension(".md");
    }
    transform(file) {
        let context = file.context;
        if (context.useCache) {
            let cached = context.cache.getStaticCache(file);
            if (cached) {
                file.isLoaded = true;
                file.contents = cached.contents;
                return;
            }
        }
        file.loadContents();
        if (!marked) {
            marked = require("marked");
        }
        if (this.options.renderer) {
            this.options.renderer = new marked.Renderer();
        }
        marked.setOptions(this.options);
        const html = marked(file.contents);
        if (this.useDefault) {
            file.contents = `module.exports.default =  ${JSON.stringify(html)}`;
        }
        else {
            file.contents = `module.exports =  ${JSON.stringify(html)}`;
        }
        if (context.useCache) {
            context.emitJavascriptHotReload(file);
            context.cache.writeStaticCache(file, file.sourceMap);
        }
    }
}
exports.FuseBoxMarkdownPlugin = FuseBoxMarkdownPlugin;
exports.MarkdownPlugin = (options) => {
    return new FuseBoxMarkdownPlugin(options);
};
