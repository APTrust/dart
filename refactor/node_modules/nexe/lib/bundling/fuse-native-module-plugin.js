"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bindings_rewrite_1 = require("./bindings-rewrite");
var embed_node_1 = require("./embed-node");
function default_1(options) {
    if (options === void 0) { options = {}; }
    return new NativeModulePlugin(options);
}
exports.default = default_1;
var NativeModulePlugin = /** @class */ (function () {
    function NativeModulePlugin(options) {
        if (options === void 0) { options = {}; }
        this.options = options;
        this.test = /node_modules.*(\.js|\.node)$|\.node$/;
        this.limit2Project = false;
    }
    NativeModulePlugin.prototype.init = function (context) {
        context.allowExtension('.node');
    };
    NativeModulePlugin.prototype.transform = function (file) {
        file.loadContents();
        if (file.absPath.endsWith('.node')) {
            embed_node_1.embedDotNode(this.options, file);
            return;
        }
        var bindingsRewrite = new bindings_rewrite_1.BindingsRewrite();
        file.makeAnalysis(null, {
            plugins: [
                {
                    onNode: function (file, node, parent) {
                        bindingsRewrite.onNode(file.absPath, node, parent);
                    },
                    onEnd: function (file) {
                        if (bindingsRewrite.rewrite) {
                            var index = file.analysis.dependencies.indexOf('bindings');
                            if (~index) {
                                file.analysis.dependencies.splice(index, 1);
                            }
                            (_a = file.analysis.dependencies).push.apply(_a, bindingsRewrite.nativeModulePaths);
                            file.analysis.requiresRegeneration = true;
                        }
                        var _a;
                    }
                }
            ]
        });
    };
    return NativeModulePlugin;
}());
exports.NativeModulePlugin = NativeModulePlugin;
