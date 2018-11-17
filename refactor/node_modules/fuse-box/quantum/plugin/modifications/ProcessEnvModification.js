"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
class ProcessEnvModification {
    static perform(core, file) {
        if (core.opts.shouldReplaceProcessEnv()) {
            return realm_utils_1.each(file.processNodeEnv, (env) => {
                if (env.isConditional) {
                    env.handleActiveCode();
                }
                else {
                    env.replaceWithValue();
                }
            });
        }
    }
}
exports.ProcessEnvModification = ProcessEnvModification;
