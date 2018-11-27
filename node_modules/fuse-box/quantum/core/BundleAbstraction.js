"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PackageAbstraction_1 = require("./PackageAbstraction");
const ASTTraverse_1 = require("../../ASTTraverse");
const FileAnalysis_1 = require("../../analysis/FileAnalysis");
class BundleAbstraction {
    constructor(name) {
        this.name = name;
        this.splitAbstraction = false;
        this.packageAbstractions = new Map();
        this.globalVariableRequired = false;
        this.identifiers = new Map();
        this.hoisted = new Map();
    }
    registerHoistedIdentifiers(identifier, statement, file) {
        let list;
        if (!this.identifiers.has(identifier)) {
            list = new Set();
            this.identifiers.set(identifier, list);
        }
        else {
            list = this.identifiers.get(identifier);
        }
        list.add({ statement: statement, file: file });
    }
    registerPackageAbstraction(packageAbstraction) {
        this.packageAbstractions.set(packageAbstraction.name, packageAbstraction);
    }
    parse(contents) {
        const ast = FileAnalysis_1.acornParse(contents);
        ASTTraverse_1.ASTTraverse.traverse(ast, {
            pre: (node, parent, prop, idx) => {
                if (node.type === "MemberExpression") {
                    if (node.object &&
                        node.object.type === "Identifier" &&
                        node.object.name === "FuseBox" &&
                        node.property &&
                        node.property.type === "Identifier" &&
                        node.property.name === "pkg" &&
                        parent.arguments &&
                        parent.arguments.length === 3) {
                        const conflictingLibraries = {};
                        if (parent.arguments[1] && parent.arguments[1].type === "ObjectExpression") {
                            const versionsNode = parent.arguments[1];
                            if (versionsNode.properties.length) {
                                versionsNode.properties.forEach(prop => {
                                    conflictingLibraries[prop.key.value] = prop.value.value;
                                });
                            }
                        }
                        const pkgName = parent.arguments[0].value;
                        const packageAst = parent.arguments[2].body;
                        let packageAbstraction;
                        if (this.packageAbstractions.get(pkgName)) {
                            packageAbstraction = this.packageAbstractions.get(pkgName);
                        }
                        else {
                            packageAbstraction = new PackageAbstraction_1.PackageAbstraction(pkgName, this);
                        }
                        packageAbstraction.conflictingLibraries = conflictingLibraries;
                        packageAbstraction.loadAst(packageAst);
                        return false;
                    }
                }
            },
        });
    }
}
exports.BundleAbstraction = BundleAbstraction;
