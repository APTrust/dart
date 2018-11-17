"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ImportDeclaration {
    static onNode(file, node, parent) {
        const analysis = file.analysis;
        if (node.type === "CallExpression" && node.callee) {
            if (node.callee.type === "Identifier" && node.callee.name === "require") {
                let arg1 = node.arguments[0];
                if (analysis.nodeIsString(arg1)) {
                    let requireStatement = this.handleAliasReplacement(file, arg1.value);
                    if (requireStatement) {
                        analysis.registerReplacement(arg1.value, requireStatement);
                        arg1.value = requireStatement;
                        analysis.addDependency(requireStatement);
                    }
                }
            }
        }
        if (node.type === "ExportDefaultDeclaration") {
            file.es6module = true;
        }
        if (node.type === "ExportAllDeclaration") {
            file.es6module = true;
            analysis.addDependency(node.source.value);
        }
        if (node.type === "ImportDeclaration" || node.type === "ExportNamedDeclaration") {
            file.es6module = true;
            if (node.source && analysis.nodeIsString(node.source)) {
                let requireStatement = this.handleAliasReplacement(file, node.source.value);
                node.source.value = requireStatement;
                analysis.addDependency(requireStatement);
            }
        }
    }
    static onEnd(file) {
        if (file.es6module) {
            file.analysis.requiresTranspilation = true;
        }
    }
    static handleAliasReplacement(file, requireStatement) {
        if (file.collection && file.collection.info && file.collection.info.browserOverrides) {
            const overrides = file.collection.info.browserOverrides;
            const pm = file.collection.pm;
            if (overrides) {
                if (overrides[requireStatement] !== undefined) {
                    if (typeof overrides[requireStatement] === "string") {
                        requireStatement = overrides[requireStatement];
                    }
                    else {
                        return;
                    }
                }
                else {
                    const resolved = pm.resolve(requireStatement, file.info.absDir);
                    if (resolved && resolved.absPath) {
                        const fuseBoxPath = pm.getFuseBoxPath(resolved.absPath, file.collection.entryFile.info.absDir);
                        if (overrides[fuseBoxPath] !== undefined) {
                            if (typeof overrides[fuseBoxPath] === "string") {
                                requireStatement = overrides[fuseBoxPath];
                            }
                            else {
                                return;
                            }
                        }
                    }
                }
            }
        }
        let result = file.context.replaceAliases(requireStatement);
        if (result.replaced) {
        }
        return result.requireStatement;
    }
}
exports.ImportDeclaration = ImportDeclaration;
