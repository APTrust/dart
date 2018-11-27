"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const File_1 = require("../../core/File");
class LanguageLevel {
    static onNode(file, node, parent) {
        if (node.async === true) {
            file.setLanguageLevel(File_1.ScriptTarget.ES2017);
        }
        else if (node.kind === "const") {
            file.setLanguageLevel(File_1.ScriptTarget.ES2015);
        }
        else if (node.kind === "let") {
            file.setLanguageLevel(File_1.ScriptTarget.ES2015);
        }
        else if (node.type === "ArrowFunctionExpression") {
            file.setLanguageLevel(File_1.ScriptTarget.ES2015);
        }
        else if (node.type === "TemplateLiteral") {
            file.setLanguageLevel(File_1.ScriptTarget.ES2015);
        }
        else if (node.type === "ClassDeclaration") {
            file.setLanguageLevel(File_1.ScriptTarget.ES2015);
        }
    }
    static onEnd(file) {
        const target = File_1.ScriptTarget[file.context.tsConfig.getConfig().compilerOptions.target];
        if (file.languageLevel > target) {
            file.analysis.requiresTranspilation = true;
        }
    }
}
exports.LanguageLevel = LanguageLevel;
