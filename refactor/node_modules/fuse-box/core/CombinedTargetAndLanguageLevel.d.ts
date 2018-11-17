import { ScriptTarget } from './File';
export declare class CombinedTargetAndLanguageLevel {
    private combination;
    constructor(combination: string);
    getTarget(): string;
    getLanguageLevel(): ScriptTarget;
    getLanguageLevelOrDefault(defaultLanguageLevel?: ScriptTarget): ScriptTarget;
    private splitCombination;
}
