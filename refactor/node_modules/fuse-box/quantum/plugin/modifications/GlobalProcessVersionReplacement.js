"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GlobalProcessVersionReplacement {
    static perform(core, file) {
        if (!file.processVariableDefined && core.opts.isTargetBrowser()) {
            if (file.globalProcessVersion.size) {
                file.renderedHeaders.push(`var process = { version : "" };`);
            }
        }
    }
}
exports.GlobalProcessVersionReplacement = GlobalProcessVersionReplacement;
