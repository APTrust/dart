"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FileAbstraction_1 = require("./FileAbstraction");
const ASTTraverse_1 = require("../../ASTTraverse");
class PackageAbstraction {
    constructor(name, bundleAbstraction) {
        this.name = name;
        this.bundleAbstraction = bundleAbstraction;
        this.fileAbstractions = new Map();
        this.entryFile = "index.js";
        this.entries = new Map();
        this.quantumBitBanned = false;
        this.quantumDynamic = false;
        bundleAbstraction.registerPackageAbstraction(this);
    }
    assignBundle(bundleAbstraction) {
        this.bundleAbstraction.packageAbstractions.delete(this.name);
        this.bundleAbstraction = bundleAbstraction;
        bundleAbstraction.packageAbstractions.set(this.name, this);
    }
    registerFileAbstraction(fileAbstraction) {
        this.fileAbstractions.set(fileAbstraction.fuseBoxPath, fileAbstraction);
    }
    loadAst(ast) {
        ASTTraverse_1.ASTTraverse.traverse(ast, {
            pre: (node, parent, prop, idx) => {
                if (node.type === "ReturnStatement" &&
                    node.argument.left.type === "MemberExpression" &&
                    node.argument.left.object.name === "___scope___" &&
                    node.argument.left.property.name === "entry" &&
                    node.argument.right &&
                    node.argument.right.type === "Literal") {
                    this.entryFile = node.argument.right.value;
                }
                if (node.type === "CallExpression" && node.callee && node.callee.type === "MemberExpression") {
                    const callee = node.callee;
                    if (callee.object && callee.object.name === "___scope___" && callee.property.name === "file") {
                        const fileName = node.arguments[0].value;
                        const fn = node.arguments[1];
                        if (fn && fn.type === "FunctionExpression") {
                            const fileAbstraction = new FileAbstraction_1.FileAbstraction(fileName, this);
                            fileAbstraction.loadAst(fn.body);
                            return false;
                        }
                    }
                }
            },
        });
    }
}
exports.PackageAbstraction = PackageAbstraction;
