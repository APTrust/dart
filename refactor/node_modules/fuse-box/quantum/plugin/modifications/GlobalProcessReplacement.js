"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GlobalProcessReplacement {
    static perform(core, file) {
        if (!file.processVariableDefined && core.opts.isTargetBrowser()) {
            file.globalProcess.forEach(item => {
                item.replaceWithString(undefined);
            });
        }
    }
}
exports.GlobalProcessReplacement = GlobalProcessReplacement;
