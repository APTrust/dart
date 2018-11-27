"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
class UseStrictModification {
    static perform(core, file) {
        if (core.opts.shouldRemoveUseStrict()) {
            return realm_utils_1.each(file.useStrict, (useStrict) => {
                return useStrict.remove();
            });
        }
    }
}
exports.UseStrictModification = UseStrictModification;
