"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
class EnvironmentConditionModification {
    static perform(core, file) {
        return realm_utils_1.each(file.fuseboxIsEnvConditions, (replacable) => {
            if (core.opts.isTargetUniveral()) {
                if (replacable.identifier === "isServer") {
                    replacable.setFunctionName(`${core.opts.quantumVariableName}.cs`);
                }
                if (replacable.identifier === "isBrowser") {
                    replacable.setFunctionName(`${core.opts.quantumVariableName}.cb`);
                }
            }
            else {
                if (replacable.isConditional) {
                    replacable.handleActiveCode();
                }
                else {
                    replacable.replaceWithValue();
                }
            }
        });
    }
}
exports.EnvironmentConditionModification = EnvironmentConditionModification;
