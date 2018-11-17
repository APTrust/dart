"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
const CSSFile_1 = require("../../core/CSSFile");
const CSSCollection_1 = require("../../core/CSSCollection");
const Utils_1 = require("../../../Utils");
class CSSModifications {
    static async perform(core, file) {
        if (!core.opts.shouldGenerateCSS()) {
            return;
        }
        const forRemoval = [];
        await realm_utils_1.each(file.requireStatements, (statement) => {
            if (statement.nodeModuleName === "fuse-box-css") {
                if (statement.ast.$parent && statement.ast.$parent.arguments) {
                    const args = statement.ast.$parent.arguments;
                    if (args.length !== 2) {
                        return;
                    }
                    const cssPath = args[0].value;
                    const cssRaw = args[1].value;
                    const cssFile = new CSSFile_1.CSSFile(cssPath, cssRaw, statement.file.packageAbstraction.name);
                    let collection;
                    if (file.quantumBit) {
                        collection = this.getQuantumBitCollection(core, file.quantumBit);
                    }
                    else {
                        collection = this.getCSSCollection(core, cssFile);
                    }
                    collection.add(cssFile);
                    core.postTasks.add(() => {
                        this.removeStatement(statement);
                    });
                    forRemoval.push(statement);
                }
            }
        });
        forRemoval.forEach(statement => {
            file.requireStatements.delete(statement);
        });
    }
    static getQuantumBitCollection(core, bit) {
        const group = bit.name;
        let collection = core.cssCollection.get(group);
        if (!collection) {
            collection = new CSSCollection_1.CSSCollection(core);
            core.api.addRemoteLoading();
            core.api.addCSSLoader();
            collection.quantumBit = bit;
            bit.cssCollection = collection;
            collection.splitCSS = true;
            core.cssCollection.set(group, collection);
        }
        return collection;
    }
    static removeStatement(statement) {
        const info = statement.removeCallExpression();
        const target = statement.file;
        if (info.success) {
            if (info.empty) {
                target.markForRemoval();
            }
            return;
        }
        target.dependents.forEach(dependent => {
            dependent.requireStatements.forEach(depStatement => {
                const targetStatement = depStatement.resolve();
                const matched = targetStatement === target;
                if (matched) {
                    depStatement.remove();
                }
            });
        });
    }
    static getCSSGroup(core, cssFile) {
        for (let key in core.opts.getCSSFiles()) {
            let [packageName, pattern] = key.split("/", 2);
            if (!pattern) {
                pattern = "*";
            }
            const regex = Utils_1.string2RegExp(pattern);
            if ((packageName === "*" || packageName === cssFile.packageName) && regex.test(cssFile.name)) {
                return key;
            }
        }
        return "default";
    }
    static getCSSCollection(core, cssFile) {
        const group = this.getCSSGroup(core, cssFile);
        let collection = core.cssCollection.get(group);
        if (!collection) {
            collection = new CSSCollection_1.CSSCollection(core);
            core.cssCollection.set(group, collection);
        }
        return collection;
    }
}
exports.CSSModifications = CSSModifications;
