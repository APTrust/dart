"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VueBlockFile_1 = require("./VueBlockFile");
class VueTemplateFile extends VueBlockFile_1.VueBlockFile {
    toFunction(code) {
        const vueTranspiler = require("vue-template-es2015-compiler");
        return vueTranspiler(`function render () {${code}}`);
    }
    async process() {
        const vueCompiler = require("vue-template-compiler");
        this.loadContents();
        return this.pluginChain
            .reduce((chain, plugin) => {
            return chain
                .then(() => {
                const promise = plugin.transform(this);
                return promise || Promise.resolve(this);
            })
                .then(() => {
                this.contents = JSON.parse(this.contents
                    .replace("module.exports.default =", "")
                    .replace("module.exports =", "")
                    .trim());
            })
                .then(() => vueCompiler.compile(this.contents));
        }, Promise.resolve())
            .then((compiled) => {
            return `Object.assign(_options, {
        _scopeId: ${this.scopeId ? JSON.stringify(this.scopeId) : null},
        render: ${this.toFunction(compiled.render)},
        staticRenderFns: [${compiled.staticRenderFns.map(t => this.toFunction(t)).join(",")}]
      })`;
        })
            .then((contents) => {
            this.contents = contents;
        });
    }
}
exports.VueTemplateFile = VueTemplateFile;
