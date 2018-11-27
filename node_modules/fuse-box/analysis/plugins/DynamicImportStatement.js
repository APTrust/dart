"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class DynamicImportStatement {
    static onNode(file, node, parent) {
        const analysis = file.analysis;
        if (node.type === "CallExpression" && node.callee) {
            if (node.callee.type === "Identifier" && node.callee.name === "$fsmp$") {
                let arg1 = node.arguments[0];
                const currentValue = arg1.value;
                if (analysis.nodeIsString(arg1)) {
                    let requireStatement = arg1.value;
                    if (file.context.bundle.producer) {
                        const producer = file.context.bundle.producer;
                        const splitConfig = producer.fuse.context.quantumSplitConfig;
                        if (splitConfig) {
                            const alisedByName = splitConfig.byName(requireStatement);
                            if (alisedByName) {
                                requireStatement = `~/${alisedByName}`;
                            }
                        }
                    }
                    let result = file.context.replaceAliases(requireStatement);
                    requireStatement = result.requireStatement;
                    let resolved = file.collection.pm.resolve(requireStatement, file.info.absDir);
                    if (resolved) {
                        if (resolved.isNodeModule) {
                            analysis.addDependency(requireStatement);
                        }
                        else {
                            if (resolved.fuseBoxPath && fs.existsSync(resolved.absPath)) {
                                arg1.value = `~/${resolved.fuseBoxPath}`;
                                if (!file.belongsToProject()) {
                                    arg1.value = `${file.collection.name}/${resolved.fuseBoxPath}`;
                                }
                                analysis.addDependency(resolved.absPath);
                                analysis.registerReplacement(currentValue, arg1.value);
                            }
                        }
                    }
                }
            }
        }
    }
    static onEnd() { }
}
exports.DynamicImportStatement = DynamicImportStatement;
