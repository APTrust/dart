"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
const QuantumBit_1 = require("../QuantumBit");
class DynamicImportStatementsModifications {
    static perform(core, file) {
        return realm_utils_1.each(file.dynamicImportStatements, (statement) => {
            let target = statement.resolve();
            if (target) {
                target.canBeRemoved = false;
                if (!target.dependents.has(file)) {
                    target.dependents.add(file);
                }
                const bit = new QuantumBit_1.QuantumBit(target, statement);
                statement.isDynamicImport = true;
                target.quantumBitEntry = true;
                target.quantumBit = bit;
                core.quantumBits.set(bit.name, bit);
                core.api.addLazyLoading();
                core.api.useCodeSplitting();
            }
            else {
                core.api.considerStatement(statement);
            }
            statement.setFunctionName(`${core.opts.quantumVariableName}.l`);
        });
    }
}
exports.DynamicImportStatementsModifications = DynamicImportStatementsModifications;
