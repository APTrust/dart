"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fuse_loader_1 = require("../fuse-loader");
var customizedHMRPlugin = {
    hmrUpdate: function (_a) {
        var type = _a.type, path = _a.path, content = _a.content;
        if (type === "js" || type === "css") {
            var isModuleStateful_1 = function (path) { return statefulModuleCheck(path); };
            /** If a stateful module has changed reload the window */
            if (isModuleStateful_1(path)) {
                window.location.reload();
            }
            /** Otherwise flush the other modules */
            fuse_loader_1.Loader.flush(function (fileName) {
                return !isModuleStateful_1(fileName);
            });
            /** Patch the module at give path */
            fuse_loader_1.Loader.dynamic(path, content);
            /** Re-import / run the mainFile */
            if (fuse_loader_1.Loader.mainFile) {
                try {
                    fuse_loader_1.Loader.import(fuse_loader_1.Loader.mainFile);
                }
                catch (e) {
                    // in case if a package was not found
                    // It probably means that it's just not in the scope
                    if (typeof e === "string") {
                        // a better way but string?!
                        if (/not found/.test(e)) {
                            window.location.reload();
                        }
                    }
                    console.error(e);
                }
            }
            /** We don't want the default behavior */
            return true;
        }
    }
};
/** Only register the plugin once */
var alreadyRegistered = false;
/** Current names of stateful modules */
var statefulModuleCheck = function () { return false; };
/**
 * Registers given module names as being stateful
 * @param isStateful for a given moduleName returns true if the module is stateful
 */
exports.setStatefulModules = function (isStateful) {
    if (!alreadyRegistered) {
        alreadyRegistered = true;
        fuse_loader_1.Loader.addPlugin(customizedHMRPlugin);
    }
    statefulModuleCheck = isStateful;
};
