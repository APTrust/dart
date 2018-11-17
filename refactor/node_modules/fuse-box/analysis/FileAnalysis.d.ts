import { File } from "../core/File";
export interface TraversalPlugin {
    onNode(file: File, node: any, parent: any): void;
    onEnd(file: File): void;
}
export declare function acornParse(contents: any, options?: any): any;
/**
 * Makes static analysis on the code
 * Gets require statements (es5 and es6)
 *
 * Adds additional injections (if needed)
 *
 * @export
 * @class FileAST
 */
export declare class FileAnalysis {
    file: File;
    ast: any;
    private wasAnalysed;
    skipAnalysis: boolean;
    bannedImports: {};
    nativeImports: {};
    fuseBoxMainFile: any;
    requiresRegeneration: boolean;
    statementReplacement: Set<{
        from: string;
        to: string;
    }>;
    requiresTranspilation: boolean;
    fuseBoxVariable: string;
    dependencies: string[];
    constructor(file: File);
    astIsLoaded(): boolean;
    /**
     * Loads an AST
     *
     * @param {*} ast
     *
     * @memberOf FileAnalysis
     */
    loadAst(ast: any): void;
    skip(): void;
    /**
     *
     *
     * @private
     *
     * @memberOf FileAST
     */
    parseUsingAcorn(options?: any): void;
    registerReplacement(rawRequireStatement: string, targetReplacement: string): void;
    handleAliasReplacement(requireStatement: string): string;
    addDependency(name: string): void;
    resetDependencies(): void;
    nodeIsString(node: any): boolean;
    replaceAliases(collection: Set<{
        from: string;
        to: string;
    }>): void;
    analyze(traversalOptions?: {
        plugins: TraversalPlugin[];
    }): void;
}
