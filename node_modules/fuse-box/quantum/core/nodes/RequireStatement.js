"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Utils_1 = require("../../../Utils");
const FileAnalysis_1 = require("../../../analysis/FileAnalysis");
function isString(node) {
    return node.type === "Literal" || node.type === "StringLiteral";
}
class RequireStatement {
    constructor(file, ast, parentAst) {
        this.file = file;
        this.ast = ast;
        this.parentAst = parentAst;
        this.isComputed = false;
        this.usedNames = new Set();
        this.localReferences = 0;
        this.isDynamicImport = false;
        this.resolved = false;
        ast.arguments = ast.arguments || [];
        const arg1 = ast.arguments[0];
        this.functionName = ast.callee.name;
        const producer = file.packageAbstraction.bundleAbstraction.producerAbstraction;
        const customComputedStatementPaths = producer.opts.customComputedStatementPaths;
        if (ast.arguments.length === 1 && isString(arg1)) {
            this.value = ast.arguments[0].value;
            this.value = this.value.replace(/([/]{2,})/g, "/");
            let moduleValues = this.value.match(/^([a-z@](?!:).*)$/);
            this.isNodeModule = moduleValues !== null && moduleValues !== undefined;
            if (moduleValues) {
                const moduleValue = moduleValues[0];
                if (moduleValue.charAt(0) === "@") {
                    let matched = moduleValue.match(/(@[a-zA-Z0-9][a-zA-Z0-9_\.-]*\/[a-zA-Z0-9][a-zA-Z0-9_-]*)\/?(.*)/i);
                    if (matched) {
                        this.nodeModuleName = matched[1];
                        this.nodeModulePartialRequire = matched[2];
                    }
                }
                else {
                    const [moduleName, ...partialRequire] = moduleValue.split("/");
                    this.nodeModuleName = moduleName;
                    this.nodeModulePartialRequire = partialRequire.join("/");
                }
            }
        }
        else {
            this.isComputed = true;
            if (this.functionName === "require") {
                let showWarning = true;
                customComputedStatementPaths.forEach((regexp, path) => {
                    if (regexp.test(file.getFuseBoxFullPath())) {
                        showWarning = false;
                    }
                });
                if (showWarning) {
                    producer.addWarning(`Computed statement warning in ${this.file.packageAbstraction.name}/${this.file.fuseBoxPath}`);
                }
            }
        }
    }
    removeCallExpression() {
        const expressionStatement = this.ast.$parent.$parent;
        let parent = expressionStatement.$parent;
        let prop = expressionStatement.$prop;
        if (prop === undefined || !parent || !Array.isArray(parent[prop])) {
            return;
        }
        const index = parent[prop].indexOf(expressionStatement);
        if (index > -1) {
            parent[prop].splice(index, 1);
            return { success: true, empty: parent[prop].length === 0 };
        }
        return { success: false };
    }
    remove() {
        const expressionStatement = this.ast.$parent;
        if (!expressionStatement) {
            return;
        }
        let parent = expressionStatement.$parent;
        let prop = expressionStatement.$prop;
        if (prop === undefined || !parent || !Array.isArray(parent[prop])) {
            return;
        }
        const index = parent[prop].indexOf(expressionStatement);
        if (index > -1) {
            parent[prop].splice(index, 1);
            return true;
        }
    }
    removeWithIdentifier() {
        const declarator = this.parentAst;
        const declaration = declarator.$parent;
        const index = declaration.declarations.indexOf(declarator);
        declaration.declarations.splice(index, 1);
        if (declaration.declarations.length === 0) {
            const body = declaration.$parent;
            const prop = declaration.$prop;
            if (Array.isArray(body[prop]) && declaration.$idx !== undefined) {
                const arrayIndex = body[prop].indexOf(declaration);
                if (arrayIndex > -1) {
                    body[prop].splice(arrayIndex, 1);
                }
            }
        }
    }
    setFunctionName(name) {
        this.ast.callee.name = name;
    }
    bindID(id) {
        this.ast.callee.name += `.bind({id:${JSON.stringify(id)}})`;
    }
    isCSSRequested() {
        return this.value && path.extname(this.value) === ".css";
    }
    isRemoteURL() {
        return this.value && /^http(s):/.test(this.value);
    }
    isJSONRequested() {
        return this.value && path.extname(this.value) === ".json";
    }
    setValue(str) {
        this.ast.arguments[0].value = str;
    }
    setExpression(raw) {
        const astStatemet = FileAnalysis_1.acornParse(raw);
        const body = astStatemet.body[0];
        if (body.type === "ExpressionStatement") {
            this.ast.arguments = [body.expression];
        }
    }
    getValue() {
        return this.ast.arguments[0].value;
    }
    resolve() {
        return this.resolveAbstraction();
    }
    resolveAbstraction() {
        let resolved;
        if (!this.resolved) {
            this.resolved = true;
            if (this.isComputed) {
                return;
            }
            let pkgName = !this.isNodeModule ? this.file.packageAbstraction.name : this.nodeModuleName;
            const conflictingVersion = this.file.packageAbstraction &&
                this.file.packageAbstraction.conflictingLibraries &&
                this.file.packageAbstraction.conflictingLibraries[pkgName];
            if (conflictingVersion) {
                pkgName += `@${conflictingVersion}`;
            }
            let resolvedName;
            const producerAbstraction = this.file.packageAbstraction.bundleAbstraction.producerAbstraction;
            if (!this.isNodeModule) {
                if (/^~\//.test(this.value)) {
                    resolvedName = this.value.slice(2);
                }
                else {
                    resolvedName = Utils_1.joinFuseBoxPath(path.dirname(this.file.fuseBoxPath), this.value);
                }
                resolved = producerAbstraction.findFileAbstraction(pkgName, resolvedName);
            }
            else {
                resolved = producerAbstraction.findFileAbstraction(pkgName, this.nodeModulePartialRequire);
            }
            if (resolved) {
                this.file.addDependency(resolved, this);
            }
            this.resolvedAbstraction = resolved;
        }
        if (this.resolvedAbstraction) {
            this.resolvedAbstraction.referencedRequireStatements.add(this);
        }
        return this.resolvedAbstraction;
    }
}
exports.RequireStatement = RequireStatement;
