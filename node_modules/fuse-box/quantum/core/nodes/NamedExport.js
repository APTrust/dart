"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GenericAst_1 = require("./GenericAst");
class NamedExport {
    constructor() {
        this.isUsed = false;
        this.eligibleForTreeShaking = true;
        this.nodes = new Set();
    }
    addNode(ast, prop, node, referencedVariableName) {
        this.referencedVariableName = referencedVariableName;
        this.nodes.add(new GenericAst_1.GenericAst(ast, prop, node));
    }
    remove() {
        this.nodes.forEach(item => item.remove());
    }
}
exports.NamedExport = NamedExport;
