"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const File_1 = require("./File");
class CombinedTargetAndLanguageLevel {
    constructor(combination) {
        this.combination = combination;
        this.combination = this.combination || "browser";
    }
    getTarget() {
        const [target,] = this.splitCombination();
        return target;
    }
    getLanguageLevel() {
        const [, languageLevel] = this.splitCombination();
        const level = languageLevel && Object.keys(File_1.ScriptTarget).find(t => t.toLowerCase() === languageLevel);
        return level ? File_1.ScriptTarget[level] : undefined;
    }
    getLanguageLevelOrDefault(defaultLanguageLevel = File_1.ScriptTarget.ES2016) {
        const languageLevel = this.getLanguageLevel();
        return languageLevel ? languageLevel : defaultLanguageLevel;
    }
    splitCombination() {
        return this.combination.toLowerCase().split("@");
    }
}
exports.CombinedTargetAndLanguageLevel = CombinedTargetAndLanguageLevel;
