"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const Utils_1 = require("../Utils");
const validPreAttrs = ["fetch", "load"];
class WebIndexPluginClass {
    constructor(opts) {
        this.opts = opts;
    }
    async generate(producer) {
        const bundles = producer.sortBundles();
        let bundlePaths = [];
        bundles.forEach(bundle => {
            let pass = true;
            if (this.opts.bundles && !this.opts.bundles.includes(bundle.name)) {
                pass = false;
            }
            pass = pass && bundle.webIndexed;
            if (pass) {
                const output = bundle.context.output;
                if (output && output.lastPrimaryOutput) {
                    if (this.opts.resolve) {
                        bundlePaths.push(this.opts.resolve(output));
                    }
                    else {
                        bundlePaths.push(Utils_1.joinFuseBoxPath(this.opts.path ? this.opts.path : "/", output.folderFromBundleName || "/", output.lastPrimaryOutput.filename));
                    }
                }
            }
        });
        let html = this.opts.templateString ||
            `<!doctype html>
                <html>
                    <head>
                        <title>$title</title>
                        $charset
                        $description
                        $keywords
                        $pre
                        $author
                        $css
                    </head>
                <body>
                    $bundles
                </body>
                </html>`;
        if (this.opts.engine) {
            const engine = this.opts.engine;
            const consolidate = require("consolidate");
            if (!consolidate[engine]) {
                const message = `ConsolidatePlugin - consolidate did not recognise the engine "${engine}"`;
                throw new Error(message);
            }
            if (!this.opts.template) {
                throw new Error("WebIndexPlugin with engine option requires 'template option specified' ");
            }
            const filePath = Utils_1.ensureAbsolutePath(this.opts.template);
            html = await consolidate[engine](filePath, this.opts.locals || {});
        }
        else {
            if (this.opts.template) {
                const pathToTemplate = Utils_1.ensureAbsolutePath(this.opts.template);
                html = fs.readFileSync(pathToTemplate, "UTF-8");
                if (this.opts.appendBundles && !html.includes("$bundles")) {
                    if (!html.includes("</body>")) {
                        html = html.replace("</body>", "$bundles</body>");
                    }
                    else if (!html.includes("</head>")) {
                        html = html.replace("</head>", "$bundles</head>");
                    }
                    else {
                        html = `${html}$bundles`;
                    }
                }
            }
        }
        const jsTags = this.opts.emitBundles
            ? this.opts.emitBundles(bundlePaths)
            : bundlePaths
                .map(bundle => `<script ${this.opts.async ? "async" : ""} ${this.opts.scriptAttributes ? this.opts.scriptAttributes : ""} type="text/javascript" src="${bundle}"></script>`)
                .join("\n");
        let preLinkTags;
        if (this.opts.pre) {
            if ((typeof this.opts.pre === "string" && !validPreAttrs.includes(this.opts.pre)) ||
                (this.opts.pre.relType && !validPreAttrs.includes(Object.values(this.opts.pre.relType)))) {
                throw new Error("Invalid `pre` option specified. Please adjust your configuration object or string as either 'fetch' or 'load'.");
            }
            if (typeof this.opts.pre === "string" && validPreAttrs.includes(this.opts.pre)) {
                preLinkTags = bundlePaths
                    .map(bundle => `<link rel="pre${this.opts.pre}" as="script" href="${bundle}">`)
                    .join("\n");
            }
            if (this.opts.pre.relType && validPreAttrs.includes(Object.values(this.opts.pre.relType))) {
                preLinkTags = bundlePaths
                    .map(bundle => `<link rel="pre${this.opts.pre.relType}" as="script" href="${bundle}">`)
                    .join("\n");
            }
        }
        let cssInjection = [];
        if (producer.injectedCSSFiles.size > 0) {
            producer.injectedCSSFiles.forEach(file => {
                const resolvedFile = this.opts.path ? path.join(this.opts.path, file) : path.join("/", file);
                cssInjection.push(`<link rel="stylesheet" href="${resolvedFile}"/>`);
            });
        }
        let macro = {
            author: this.opts.author ? `<meta name="author" content="${this.opts.author}">` : "",
            bundles: jsTags,
            charset: this.opts.charset ? `<meta charset="${this.opts.charset}">` : "",
            css: cssInjection.join("\n"),
            description: this.opts.description ? `<meta name="description" content="${this.opts.description}">` : "",
            keywords: this.opts.keywords ? `<meta name="keywords" content="${this.opts.keywords}">` : "",
            pre: this.opts.pre ? preLinkTags : "",
            title: this.opts.title ? this.opts.title : "",
        };
        for (let key in macro) {
            html = html.replace("$" + key, macro[key]);
        }
        producer.fuse.context.output.writeToOutputFolder(this.opts.target || "index.html", html);
    }
    producerEnd(producer) {
        this.generate(producer);
        producer.sharedEvents.on("file-changed", () => {
            this.generate(producer);
        });
    }
}
exports.WebIndexPluginClass = WebIndexPluginClass;
exports.WebIndexPlugin = (opts) => {
    return new WebIndexPluginClass(opts || {});
};
