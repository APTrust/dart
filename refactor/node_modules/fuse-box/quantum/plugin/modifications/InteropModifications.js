"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
class InteropModifications {
    static perform(core, file) {
        if (core.opts.shouldRemoveExportsInterop()) {
            return realm_utils_1.each(file.exportsInterop, (interop) => {
                return interop.remove();
            });
        }
    }
}
exports.InteropModifications = InteropModifications;
