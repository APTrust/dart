"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ASTTraverse_1 = require("./../ASTTraverse");
const PrettyError_1 = require("./../PrettyError");
const acorn = require("acorn");
const AutoImport_1 = require("./plugins/AutoImport");
const LanguageLevel_1 = require("./plugins/LanguageLevel");
const OwnVariable_1 = require("./plugins/OwnVariable");
const OwnBundle_1 = require("./plugins/OwnBundle");
const ImportDeclaration_1 = require("./plugins/ImportDeclaration");
const DynamicImportStatement_1 = require("./plugins/DynamicImportStatement");
const Utils_1 = require("../Utils");
require("acorn-jsx/inject")(acorn);
const plugins = [
    AutoImport_1.AutoImport,
    OwnVariable_1.OwnVariable,
    OwnBundle_1.OwnBundle,
    ImportDeclaration_1.ImportDeclaration,
    DynamicImportStatement_1.DynamicImportStatement,
    LanguageLevel_1.LanguageLevel,
];
function acornParse(contents, options) {
    return acorn.parse(contents, {
        ...(options || {}),
        ...{
            sourceType: "module",
            tolerant: true,
            locations: true,
            ranges: true,
            ecmaVersion: "2018",
            plugins: {
                jsx: true
            },
            jsx: { allowNamespacedObjects: true },
        },
    });
}
exports.acornParse = acornParse;
class FileAnalysis {
    constructor(file) {
        this.file = file;
        this.wasAnalysed = false;
        this.skipAnalysis = false;
        this.bannedImports = {};
        this.nativeImports = {};
        this.requiresRegeneration = false;
        this.statementReplacement = new Set();
        this.requiresTranspilation = false;
        this.fuseBoxVariable = "FuseBox";
        this.dependencies = [];
    }
    astIsLoaded() {
        return this.ast !== undefined;
    }
    loadAst(ast) {
        this.ast = ast;
    }
    skip() {
        this.skipAnalysis = true;
    }
    parseUsingAcorn(options) {
        try {
            this.ast = acornParse(this.file.contents, options);
        }
        catch (err) {
            return PrettyError_1.PrettyError.errorWithContents(err, this.file);
        }
    }
    registerReplacement(rawRequireStatement, targetReplacement) {
        if (rawRequireStatement !== targetReplacement) {
            this.statementReplacement.add({ from: rawRequireStatement, to: targetReplacement });
        }
    }
    handleAliasReplacement(requireStatement) {
        if (!this.file.context.experimentalAliasEnabled) {
            return requireStatement;
        }
        const aliasCollection = this.file.context.aliasCollection;
        aliasCollection.forEach(props => {
            if (props.expr.test(requireStatement)) {
                requireStatement = requireStatement.replace(props.expr, `${props.replacement}$2`);
                this.requiresRegeneration = true;
            }
        });
        return requireStatement;
    }
    addDependency(name) {
        this.dependencies.push(name);
    }
    resetDependencies() {
        this.dependencies = [];
    }
    nodeIsString(node) {
        return node.type === "Literal" || node.type === "StringLiteral";
    }
    replaceAliases(collection) {
        collection.forEach(item => {
            const regExp = new RegExp(`(require|\\$fsmp\\$)\\(('|")${Utils_1.escapeRegExp(item.from)}('|")\\)`);
            this.file.contents = this.file.contents.replace(regExp, `$1("${item.to}")`);
        });
    }
    analyze(traversalOptions) {
        if (this.wasAnalysed || this.skipAnalysis) {
            return;
        }
        if (this.file.collection && this.file.collection.info && this.file.collection.info.jsNext) {
            this.file.es6module = true;
        }
        let traversalPlugins = plugins;
        if (traversalOptions && Array.isArray(traversalOptions.plugins)) {
            traversalPlugins = plugins.concat(traversalOptions.plugins);
        }
        ASTTraverse_1.ASTTraverse.traverse(this.ast, {
            pre: (node, parent, prop, idx) => traversalPlugins.forEach(plugin => plugin.onNode(this.file, node, parent)),
        });
        traversalPlugins.forEach(plugin => plugin.onEnd(this.file));
        this.wasAnalysed = true;
        this.replaceAliases(this.statementReplacement);
        if (this.requiresRegeneration) {
            this.file.contents = this.file.context.generateCode(this.ast, {});
        }
        if (this.requiresTranspilation) {
            let result = this.file.transpileUsingTypescript();
            this.file.contents = result.outputText;
        }
    }
}
exports.FileAnalysis = FileAnalysis;
