"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GenericAst {
    constructor(ast, astProp, node) {
        this.ast = ast;
        this.astProp = astProp;
        this.node = node;
    }
    remove() {
        let target = this.ast[this.astProp];
        if (target instanceof Array) {
            let idx = target.indexOf(this.node);
            target.splice(idx, 1);
        }
    }
    replaceWithString(value) {
        let ast = {
            type: "Literal",
            value: value,
        };
        if (value === undefined) {
            ast = {
                type: "Identifier",
                name: "undefined",
            };
        }
        if (this.astProp) {
            if (Array.isArray(this.ast[this.astProp]) && this.node.$idx > -1) {
                this.ast[this.astProp][this.node.$idx] = ast;
            }
            else {
                this.ast[this.astProp] = ast;
            }
        }
    }
}
exports.GenericAst = GenericAst;
