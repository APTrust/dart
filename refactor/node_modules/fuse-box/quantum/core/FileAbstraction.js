"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escodegen = require("escodegen");
const path = require("path");
const FileAnalysis_1 = require("../../analysis/FileAnalysis");
const ASTTraverse_1 = require("../../ASTTraverse");
const Utils_1 = require("../../Utils");
const AstUtils_1 = require("./AstUtils");
const ExportsInterop_1 = require("./nodes/ExportsInterop");
const GenericAst_1 = require("./nodes/GenericAst");
const NamedExport_1 = require("./nodes/NamedExport");
const ReplaceableBlock_1 = require("./nodes/ReplaceableBlock");
const RequireStatement_1 = require("./nodes/RequireStatement");
const TypeOfExportsKeyword_1 = require("./nodes/TypeOfExportsKeyword");
const TypeOfModuleKeyword_1 = require("./nodes/TypeOfModuleKeyword");
const UseStrict_1 = require("./nodes/UseStrict");
const globalNames = new Set(["__filename", "__dirname", "exports", "module"]);
const SystemVars = new Set(["module", "exports", "require", "window", "global"]);
class FileAbstraction {
    constructor(fuseBoxPath, packageAbstraction) {
        this.fuseBoxPath = fuseBoxPath;
        this.packageAbstraction = packageAbstraction;
        this.dependents = new Set();
        this.referencedRequireStatements = new Set();
        this.isEcmaScript6 = false;
        this.shakable = false;
        this.amountOfReferences = 0;
        this.canBeRemoved = false;
        this.quantumBitEntry = false;
        this.quantumBitBanned = false;
        this.quantumDynamic = false;
        this.namedRequireStatements = new Map();
        this.requireStatements = new Set();
        this.dynamicImportStatements = new Set();
        this.fuseboxIsEnvConditions = new Set();
        this.definedLocally = new Set();
        this.exportsInterop = new Set();
        this.useStrict = new Set();
        this.typeofExportsKeywords = new Set();
        this.typeofModulesKeywords = new Set();
        this.typeofWindowKeywords = new Set();
        this.typeofGlobalKeywords = new Set();
        this.typeofDefineKeywords = new Set();
        this.typeofRequireKeywords = new Set();
        this.namedExports = new Map();
        this.processNodeEnv = new Set();
        this.isEntryPoint = false;
        this.localExportUsageAmount = new Map();
        this.globalVariables = new Set();
        this.treeShakingRestricted = false;
        this.removalRestricted = false;
        this.dependencies = new Map();
        this.fuseBoxDir = Utils_1.ensureFuseBoxPath(path.dirname(fuseBoxPath));
        this.setID(fuseBoxPath);
        this.globalProcess = new Set();
        this.renderedHeaders = [];
        this.globalProcessVersion = new Set();
        this.processVariableDefined = false;
        packageAbstraction.registerFileAbstraction(this);
        this.core = this.packageAbstraction.bundleAbstraction.producerAbstraction.quantumCore;
        if (this.core && !this.core.opts.shouldBundleProcessPolyfill() && this.isProcessPolyfill()) {
            this.markForRemoval();
        }
    }
    isProcessPolyfill() {
        return this.getFuseBoxFullPath() === "process/index.js";
    }
    registerHoistedIdentifiers(identifier, statement, resolvedFile) {
        const bundle = this.packageAbstraction.bundleAbstraction;
        bundle.registerHoistedIdentifiers(identifier, statement, resolvedFile);
    }
    getFuseBoxFullPath() {
        return `${this.packageAbstraction.name}/${this.fuseBoxPath}`;
    }
    isNotUsedAnywhere() {
        let entryPointForQuantumBit = false;
        if (this.quantumBit) {
            if (this.quantumBit.entry.getFuseBoxFullPath() === this.getFuseBoxFullPath()) {
                entryPointForQuantumBit = true;
            }
        }
        return (this.getID().toString() !== "0" && this.dependents.size === 0 && !entryPointForQuantumBit && !this.isEntryPoint);
    }
    releaseDependent(file) {
        this.dependents.delete(file);
    }
    markForRemoval() {
        this.canBeRemoved = true;
    }
    loadString(contents) {
        this.ast = FileAnalysis_1.acornParse(contents);
        this.analyse();
    }
    setID(id) {
        this.id = id;
    }
    belongsToProject() {
        return this.core.context.defaultPackageName === this.packageAbstraction.name;
    }
    belongsToExternalModule() {
        return !this.belongsToProject();
    }
    getID() {
        return this.id;
    }
    isTreeShakingAllowed() {
        return this.treeShakingRestricted === false && this.shakable;
    }
    restrictRemoval() {
        this.removalRestricted = true;
    }
    isRemovalAllowed() {
        return this.removalRestricted === false;
    }
    restrictTreeShaking() {
        this.treeShakingRestricted = true;
    }
    addDependency(file, statement) {
        let list;
        if (this.dependencies.has(file)) {
            list = this.dependencies.get(file);
        }
        else {
            list = new Set();
            this.dependencies.set(file, list);
        }
        list.add(statement);
    }
    getDependencies() {
        return this.dependencies;
    }
    loadAst(ast) {
        ast.type = "Program";
        this.ast = ast;
        this.analyse();
    }
    findRequireStatements(exp) {
        const list = [];
        this.requireStatements.forEach(statement => {
            if (exp.test(statement.value)) {
                list.push(statement);
            }
        });
        return list;
    }
    wrapWithFunction(args) {
        this.wrapperArguments = args;
    }
    isRequireStatementUsed() {
        return this.requireStatements.size > 0;
    }
    isDynamicStatementUsed() {
        let used = false;
        this.requireStatements.forEach(statement => {
            if (statement.isDynamicImport) {
                used = true;
            }
        });
        return used;
    }
    isDirnameUsed() {
        return this.globalVariables.has("__dirname");
    }
    isFilenameUsed() {
        return this.globalVariables.has("__filename");
    }
    isExportStatementInUse() {
        return this.globalVariables.has("exports");
    }
    isModuleStatementInUse() {
        return this.globalVariables.has("module");
    }
    isExportInUse() {
        return this.globalVariables.has("exports") || this.globalVariables.has("module");
    }
    setEntryPoint() {
        this.isEntryPoint = true;
        this.treeShakingRestricted = true;
    }
    generate(ensureEs5 = false) {
        let code = escodegen.generate(this.ast);
        if (ensureEs5 && this.isEcmaScript6) {
            code = Utils_1.transpileToEs5(code);
        }
        let fn = ["function(", this.wrapperArguments ? this.wrapperArguments.join(",") : "", "){\n"];
        if (this.isDirnameUsed()) {
            fn.push(`var __dirname = ${JSON.stringify(this.fuseBoxDir)};` + "\n");
        }
        if (this.renderedHeaders.length) {
            fn.push(this.renderedHeaders.join("\n") + "\n");
        }
        if (this.isFilenameUsed()) {
            fn.push(`var __filename = ${JSON.stringify(this.fuseBoxPath)};` + "\n");
        }
        fn.push(code, "\n}");
        code = fn.join("");
        return code;
    }
    onNode(node, parent, prop, idx) {
        if (this.core) {
            if (this.core.opts.definedExpressions) {
                const matchedExpression = AstUtils_1.matchesDefinedExpression(node, this.core.opts.definedExpressions);
                if (matchedExpression) {
                    if (matchedExpression.isConditional) {
                        const result = AstUtils_1.compareStatement(node, matchedExpression.value);
                        const block = new ReplaceableBlock_1.ReplaceableBlock(node.test, "left", node.test.left);
                        this.processNodeEnv.add(block);
                        return block.conditionalAnalysis(node, result);
                    }
                    else {
                        const block = new ReplaceableBlock_1.ReplaceableBlock(parent, prop, node);
                        if (block === undefined) {
                            block.setUndefinedValue();
                        }
                        else {
                            block.setValue(matchedExpression.value);
                        }
                        this.processNodeEnv.add(block);
                    }
                }
            }
            const processKeyInIfStatement = AstUtils_1.matchesIfStatementProcessEnv(node);
            const value = this.core.producer.userEnvVariables[processKeyInIfStatement];
            if (processKeyInIfStatement) {
                const result = AstUtils_1.compareStatement(node, value);
                const processNode = new ReplaceableBlock_1.ReplaceableBlock(node.test, "left", node.test.left);
                this.processNodeEnv.add(processNode);
                return processNode.conditionalAnalysis(node, result);
            }
            else {
                const inlineProcessKey = AstUtils_1.matchesNodeEnv(node);
                if (inlineProcessKey) {
                    const value = this.core.producer.userEnvVariables[inlineProcessKey];
                    const env = new ReplaceableBlock_1.ReplaceableBlock(parent, prop, node);
                    value === undefined ? env.setUndefinedValue() : env.setValue(value);
                    this.processNodeEnv.add(env);
                }
            }
            const isEnvName = AstUtils_1.matchesIfStatementFuseBoxIsEnvironment(node);
            if (isEnvName) {
                let value;
                if (isEnvName === "isServer") {
                    value = this.core.opts.isTargetServer();
                }
                if (isEnvName === "isBrowser") {
                    value = this.core.opts.isTargetBrowser();
                }
                if (isEnvName === "target") {
                    value = this.core.opts.getTarget();
                }
                if (!this.core.opts.isTargetUniveral()) {
                    const isEnvNode = new ReplaceableBlock_1.ReplaceableBlock(node, "", node.test);
                    isEnvNode.identifier = isEnvName;
                    this.fuseboxIsEnvConditions.add(isEnvNode);
                    return isEnvNode.conditionalAnalysis(node, value);
                }
            }
            if (AstUtils_1.matchesDoubleMemberExpression(node, "FuseBox")) {
                let envName = node.property.name;
                if (envName === "isServer" || envName === "isBrowser" || envName === "target") {
                    let value;
                    if (envName === "isServer") {
                        value = this.core.opts.isTargetServer();
                    }
                    if (envName === "isBrowser") {
                        value = this.core.opts.isTargetBrowser();
                    }
                    if (envName === "target") {
                        value = this.core.opts.getTarget();
                    }
                    const envNode = new ReplaceableBlock_1.ReplaceableBlock(parent, prop, node);
                    envNode.identifier = envName;
                    envNode.setValue(value);
                    this.fuseboxIsEnvConditions.add(envNode);
                }
            }
        }
        if (AstUtils_1.matchesGlobalVariable(node, "process")) {
            this.globalProcess.add(new GenericAst_1.GenericAst(parent, prop, node));
        }
        if (AstUtils_1.matchesGlobalVariableReference(node, "process.version")) {
            this.globalProcessVersion.add(new GenericAst_1.GenericAst(parent, prop, node));
        }
        if (AstUtils_1.matchesVariableDeclarator(node, "process")) {
            this.processVariableDefined = true;
        }
        if (AstUtils_1.matchesEcmaScript6(node)) {
            this.isEcmaScript6 = true;
        }
        this.namedRequireStatements.forEach((statement, key) => {
            const importedName = AstUtils_1.trackRequireMember(node, key);
            if (importedName) {
                statement.localReferences++;
                statement.usedNames.add(importedName);
            }
        });
        AstUtils_1.isExportComputed(node, isComputed => {
            if (isComputed) {
                this.restrictTreeShaking();
            }
        });
        AstUtils_1.isExportMisused(node, name => {
            const createdExports = this.namedExports.get(name);
            if (createdExports) {
                createdExports.eligibleForTreeShaking = false;
            }
        });
        const matchesExportIdentifier = AstUtils_1.matchesExportReference(node);
        if (matchesExportIdentifier) {
            let ref = this.localExportUsageAmount.get(matchesExportIdentifier);
            if (ref === undefined) {
                this.localExportUsageAmount.set(matchesExportIdentifier, 1);
            }
            else {
                this.localExportUsageAmount.set(matchesExportIdentifier, ++ref);
            }
        }
        AstUtils_1.matchNamedExport(node, (name, referencedVariableName) => {
            let namedExport;
            if (!this.namedExports.get(name)) {
                namedExport = new NamedExport_1.NamedExport();
                namedExport.name = name;
                this.namedExports.set(name, namedExport);
            }
            else {
                namedExport = this.namedExports.get(name);
            }
            namedExport.addNode(parent, prop, node, referencedVariableName);
        });
        if (AstUtils_1.isTrueRequireFunction(node)) {
            node.name = this.core.opts.quantumVariableName;
        }
        if (AstUtils_1.matchesSingleFunction(node, "require")) {
            this.requireStatements.add(new RequireStatement_1.RequireStatement(this, node));
        }
        if (AstUtils_1.matchesSingleFunction(node, "$fsmp$")) {
            const reqStatement = new RequireStatement_1.RequireStatement(this, node);
            reqStatement.isDynamicImport = true;
            this.dynamicImportStatements.add(reqStatement);
        }
        if (AstUtils_1.matchesTypeOf(node, "module")) {
            this.typeofModulesKeywords.add(new TypeOfModuleKeyword_1.TypeOfModuleKeyword(parent, prop, node));
        }
        if (AstUtils_1.matchesTypeOf(node, "require")) {
            this.typeofRequireKeywords.add(new GenericAst_1.GenericAst(parent, prop, node));
        }
        if (AstUtils_1.matcheObjectDefineProperty(node, "exports")) {
            if (!this.globalVariables.has("exports")) {
                this.globalVariables.add("exports");
            }
            this.exportsInterop.add(new ExportsInterop_1.ExportsInterop(parent, prop, node));
        }
        if (AstUtils_1.matchesAssignmentExpression(node, "exports", "__esModule")) {
            if (!this.globalVariables.has("exports")) {
                this.globalVariables.add("exports");
            }
            this.exportsInterop.add(new ExportsInterop_1.ExportsInterop(parent, prop, node));
        }
        if (AstUtils_1.matchesTypeOf(node, "exports")) {
            this.typeofExportsKeywords.add(new TypeOfExportsKeyword_1.TypeOfExportsKeyword(parent, prop, node));
        }
        if (AstUtils_1.matchesLiteralStringExpression(node, "use strict")) {
            this.useStrict.add(new UseStrict_1.UseStrict(parent, prop, node));
        }
        if (AstUtils_1.matchesTypeOf(node, "global")) {
            this.typeofGlobalKeywords.add(new GenericAst_1.GenericAst(parent, prop, node));
        }
        if (AstUtils_1.matchesTypeOf(node, "define")) {
            this.typeofDefineKeywords.add(new GenericAst_1.GenericAst(parent, prop, node));
        }
        if (AstUtils_1.matchesTypeOf(node, "window")) {
            this.typeofWindowKeywords.add(new GenericAst_1.GenericAst(parent, prop, node));
        }
        const requireIdentifier = AstUtils_1.matchRequireIdentifier(node);
        if (requireIdentifier) {
            const identifiedRequireStatement = new RequireStatement_1.RequireStatement(this, node.init, node);
            identifiedRequireStatement.identifier = requireIdentifier;
            this.namedRequireStatements.set(requireIdentifier, identifiedRequireStatement);
            this.requireStatements.add(identifiedRequireStatement);
            return false;
        }
        if (AstUtils_1.matchesDoubleMemberExpression(node, "FuseBox")) {
            if (node.property.name === "import") {
                parent.callee = {
                    type: "Identifier",
                    name: "require",
                };
                this.requireStatements.add(new RequireStatement_1.RequireStatement(this, parent, parent.$parent));
            }
            return false;
        }
        if (node && node.type === "Identifier") {
            let globalVariable;
            if (globalNames.has(node.name)) {
                globalVariable = node.name;
            }
            if (node.name === "global") {
                this.packageAbstraction.bundleAbstraction.globalVariableRequired = true;
            }
            this.detectLocallyDefinedSystemVariables(node);
            if (globalVariable) {
                if (!this.globalVariables.has(globalVariable)) {
                    this.globalVariables.add(globalVariable);
                }
            }
        }
    }
    detectLocallyDefinedSystemVariables(node) {
        let definedName;
        if (SystemVars.has(node.name)) {
            if (node.$prop === "params") {
                if (node.$parent && node.$parent.type === "FunctionDeclaration") {
                    definedName = node.name;
                }
            }
            if (node.$prop === "id") {
                if (node.$parent && node.$parent.type == "VariableDeclarator") {
                    definedName = node.name;
                }
            }
        }
        if (definedName) {
            if (!this.definedLocally.has(definedName)) {
                this.definedLocally.add(definedName);
            }
        }
    }
    analyse() {
        ASTTraverse_1.ASTTraverse.traverse(this.ast, {
            pre: (node, parent, prop, idx) => this.onNode(node, parent, prop, idx),
        });
    }
}
exports.FileAbstraction = FileAbstraction;
