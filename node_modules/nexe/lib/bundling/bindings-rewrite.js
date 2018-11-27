"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var child = require("child_process");
function findNativeModulePath(filePath, bindingsArg) {
    var dirname = path.dirname(filePath);
    var tempFile = Math.random() * 100 + '.js';
    var tempFilePath = path.join(dirname, tempFile);
    fs.writeFileSync(tempFilePath, "\n    var bindings = require('bindings');\n    var Module = require('module');\n    var originalRequire = Module.prototype.require;\n    Module.prototype.require = function(path) {\n      const mod = originalRequire.apply(this, arguments);\n      process.stdout.write(path)\n      return mod\n    };\n    bindings('" + bindingsArg + "')\n  ");
    //using exec because it can be done sync
    var nativeFileName = child.execSync('node ' + tempFile, { cwd: dirname }).toString();
    fs.unlinkSync(tempFilePath);
    var relativePath = './' + path.relative(dirname, nativeFileName).replace(/\\/g, '/');
    return relativePath;
}
/**
 * Traverse all nodes in a file and evaluate usages of the bindings module
 * handles two common cases
 */
var BindingsRewrite = /** @class */ (function () {
    function BindingsRewrite() {
        this.bindingsIdNodes = [];
        this.nativeModulePaths = [];
        this.rewrite = false;
    }
    BindingsRewrite.prototype.isRequire = function (node, moduleName) {
        return node.callee.name === 'require' && node.arguments[0].value === moduleName;
    };
    BindingsRewrite.prototype.onNode = function (absolutePath, node, parent) {
        if (node.type === 'CallExpression') {
            if (this.isRequire(node, 'bindings') && parent.type === 'VariableDeclarator') {
                /**
                 * const loadBindings = require('bindings');
                 *   -> const loadBindings = String('');
                 */
                this.bindingsIdNodes.push(parent.id);
                node.callee.name = 'String';
                node.arguments[0].value = '';
                this.rewrite = true;
                return;
            }
            if (this.isRequire(node, 'bindings') && parent.type === 'CallExpression') {
                /**
                 *const bindings = require('bindings')('native-module')....
                 *  -> const bindings = require('./path/to/native/module.node').....
                 */
                var bindingsArgNode = parent.arguments[0];
                if (bindingsArgNode.type === 'Literal') {
                    parent.callee = { type: 'Identifier', name: 'require' };
                    bindingsArgNode.value = findNativeModulePath(absolutePath, bindingsArgNode.value);
                    this.nativeModulePaths.push(bindingsArgNode.value);
                    this.rewrite = true;
                    return;
                }
            }
            var bindingsInvocationIdx = this.bindingsIdNodes.findIndex(function (x) { return node.callee.name === x.name; });
            if (this.bindingsIdNodes[bindingsInvocationIdx]) {
                /**
                 * const bindings = loadBindings('native-module')
                 *   -> const bindings = require('./path/to/native/module.node')
                 */
                var bindingsIdNode = this.bindingsIdNodes[bindingsInvocationIdx];
                var bindingsArgNode = node.arguments[0];
                this.bindingsIdNodes.splice(bindingsInvocationIdx, 1);
                if (bindingsArgNode.type === 'Literal') {
                    node.callee.name = 'require';
                    bindingsArgNode.value = findNativeModulePath(absolutePath, bindingsArgNode.value);
                    this.nativeModulePaths.push(bindingsArgNode.value);
                    this.rewrite = true;
                    return;
                }
            }
        }
    };
    return BindingsRewrite;
}());
exports.BindingsRewrite = BindingsRewrite;
