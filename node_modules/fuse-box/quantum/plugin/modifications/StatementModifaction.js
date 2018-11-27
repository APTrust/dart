"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
class StatementModification {
    static perform(core, file) {
        return realm_utils_1.each(file.requireStatements, (statement) => {
            if (statement.isComputed) {
                let customSolution = core.getCustomSolution(file);
                if (customSolution && !core.api.hashesUsed()) {
                    if (customSolution.rules) {
                        customSolution.rules.fn(statement, core);
                    }
                    statement.setFunctionName(`${core.opts.quantumVariableName}.p`);
                }
                else {
                    if (core.opts.isTargetServer() || core.opts.isTargetUniveral()) {
                        core.api.useServerRequire();
                        statement.setFunctionName(`${core.opts.quantumVariableName}.s`);
                    }
                    else {
                        statement.setFunctionName(`${core.opts.quantumVariableName}.r`);
                    }
                }
            }
            else {
                let resolvedFile = statement.resolve();
                if (resolvedFile) {
                    if (resolvedFile.isProcessPolyfill() && !core.opts.shouldBundleProcessPolyfill()) {
                        return statement.removeWithIdentifier();
                    }
                    if (!resolvedFile.dependents.has(file)) {
                        resolvedFile.dependents.add(file);
                    }
                    resolvedFile.amountOfReferences++;
                    if (statement.identifier) {
                        file.registerHoistedIdentifiers(statement.identifier, statement, resolvedFile);
                    }
                    statement.setFunctionName(`${core.opts.quantumVariableName}.r`);
                    statement.setValue(resolvedFile.getID());
                }
                else {
                    if (core.opts.isTargetNpm()) {
                        statement.setFunctionName("require");
                    }
                    else if (core.opts.isTargetServer() || core.opts.isTargetUniveral()) {
                        core.api.useServerRequire();
                        statement.setFunctionName(`${core.opts.quantumVariableName}.s`);
                    }
                    else {
                        statement.setFunctionName(`${core.opts.quantumVariableName}.r`);
                    }
                }
            }
        });
    }
}
exports.StatementModification = StatementModification;
