"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realm_utils_1 = require("realm-utils");
class TypeOfModifications {
    static perform(core, file) {
        if (!core.opts.shouldReplaceTypeOf()) {
            return;
        }
        return realm_utils_1.each(file.typeofExportsKeywords, (keyword) => {
            if (!file.definedLocally.has("exports")) {
                keyword.replaceWithString("object");
            }
        })
            .then(() => {
            return realm_utils_1.each(file.typeofModulesKeywords, (keyword) => {
                if (!file.definedLocally.has("module")) {
                    keyword.replaceWithString("object");
                }
            });
        })
            .then(() => {
            return realm_utils_1.each(file.typeofGlobalKeywords, (keyword) => {
                if (core.opts.isTargetBrowser()) {
                    if (!file.definedLocally.has("global")) {
                        keyword.replaceWithString("undefined");
                    }
                }
                if (core.opts.isTargetServer()) {
                    if (!file.definedLocally.has("global")) {
                        keyword.replaceWithString("object");
                    }
                }
            });
        })
            .then(() => {
            return realm_utils_1.each(file.typeofWindowKeywords, (keyword) => {
                if (core.opts.isTargetBrowser()) {
                    if (!file.definedLocally.has("window")) {
                        keyword.replaceWithString("object");
                    }
                }
                if (core.opts.isTargetServer()) {
                    if (!file.definedLocally.has("window")) {
                        keyword.replaceWithString("undefined");
                    }
                }
            });
        })
            .then(() => {
            return realm_utils_1.each(file.typeofDefineKeywords, (keyword) => {
                keyword.replaceWithString("undefined");
            });
        })
            .then(() => {
            return realm_utils_1.each(file.typeofRequireKeywords, (keyword) => {
                if (!file.definedLocally.has("require")) {
                    keyword.replaceWithString("function");
                }
            });
        });
    }
}
exports.TypeOfModifications = TypeOfModifications;
