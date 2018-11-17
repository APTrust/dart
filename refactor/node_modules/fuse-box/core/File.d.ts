import { ModuleCollection } from "./ModuleCollection";
import { FileAnalysis, TraversalPlugin } from "../analysis/FileAnalysis";
import { WorkFlowContext, Plugin } from "./WorkflowContext";
import { IPathInformation, IPackageInformation } from "./PathMaster";
/**
 * Same Target Enumerator used in TypeScript
 */
export declare enum ScriptTarget {
    ES5 = 1,
    ES2015 = 2,
    ES6 = 2,
    ES2016 = 3,
    ES7 = 3,
    ES2017 = 4,
    ESNext = 5
}
/**
 *
 *
 * @export
 * @class File
 */
export declare class File {
    context: WorkFlowContext;
    info: IPathInformation;
    isFuseBoxBundle: boolean;
    languageLevel: ScriptTarget;
    es6module: boolean;
    dependants: Set<string>;
    dependencies: Set<string>;
    cssDependencies: string[];
    /**
     * In order to keep bundle in a bundle
     * We can't destory the original contents
     * But instead we add additional property that will override bundle file contents
     *
     * @type {string}
     * @memberOf FileAnalysis
     */
    alternativeContent: string;
    shouldIgnoreDeps: boolean;
    resolveDepsOnly: boolean;
    notFound: boolean;
    params: Map<string, string>;
    wasTranspiled: boolean;
    cached: boolean;
    devLibsRequired: any;
    /**
     *
     *
     * @type {string}
     * @memberOf File
     */
    absPath: string;
    relativePath: string;
    /**
     *
     *
     * @type {string}
     * @memberOf File
     */
    contents: string;
    /**
     *
     *
     *
     * @memberOf File
     */
    isLoaded: boolean;
    ignoreCache: boolean;
    /**
     *
     *
     *
     * @memberOf File
     */
    isNodeModuleEntry: boolean;
    /**
     *
     *
     * @type {ModuleCollection}
     * @memberOf File
     */
    collection: ModuleCollection;
    /**
     *
     *
     * @type {string[]}
     * @memberOf File
     */
    headerContent: string[];
    /**
     *
     *
     *
     * @memberOf File
     */
    isTypeScript: boolean;
    /**
     *
     *
     * @type {*}
     * @memberOf File
     */
    sourceMap: any;
    properties: Map<string, any>;
    /**
     *
     *
     * @type {FileAnalysis}
     * @memberOf File
     */
    analysis: FileAnalysis;
    /**
     *
     *
     * @type {Promise<any>[]}
     * @memberOf File
     */
    resolving: Promise<any>[];
    subFiles: File[];
    groupMode: boolean;
    groupHandler: Plugin;
    hasExtensionOverride: boolean;
    addAlternativeContent(str: string): void;
    /**
     * Creates an instance of File.
     *
     * @param {WorkFlowContext} context
     * @param {IPathInformation} info
     *
     * @memberOf File
     */
    constructor(context: WorkFlowContext, info: IPathInformation);
    registerDependant(file: File): void;
    registerDependency(file: File): void;
    static createByName(collection: ModuleCollection, name: string): File;
    static createModuleReference(collection: ModuleCollection, packageInfo: IPackageInformation): File;
    setLanguageLevel(level: ScriptTarget): void;
    addProperty(key: string, obj: any): void;
    addStringDependency(name: string): void;
    getProperty(key: string): any;
    hasSubFiles(): boolean;
    addSubFile(file: File): void;
    getUniquePath(): string;
    /**
     *
     *
     * @returns
     *
     * @memberOf File
     */
    getCrossPlatormPath(): string;
    /**
     * Typescript transformation needs to be handled
     * Before the actual transformation
     * Can't exists within a chain group
     */
    tryTypescriptPlugins(): void;
    /**
     *
     *
     * @param {*} [_ast]
     *
     * @memberOf File
     */
    tryPlugins(_ast?: any): Promise<any>;
    /**
     *
     *
     * @param {*} [_ast]
     *
     * @memberOf File
     */
    tryAllPlugins(_ast?: any): Promise<any>;
    /**
     *
     *
     * @param {string} str
     *
     * @memberOf File
     */
    addHeaderContent(str: string): void;
    /**
     *
     *
     *
     * @memberOf File
     */
    loadContents(): void;
    makeAnalysis(parserOptions?: any, traversalOptions?: {
        plugins: TraversalPlugin[];
    }): void;
    /**
     * Replacing import() with a special function
     * that will recognised by Vanilla Api and Quantum
     * Injecting a development functionality
     */
    replaceDynamicImports(localContent?: string): string;
    belongsToProject(): boolean;
    /**
     *
     *
     * @returns
     *
     * @memberOf File
     */
    consume(): void | Promise<any>;
    fileDependsOnLastChangedCSS(): boolean;
    bustCSSCache: boolean;
    isCSSCached(type?: string): boolean;
    loadFromCache(): boolean;
    loadVendorSourceMap(): void;
    transpileUsingTypescript(): any;
    generateInlinedCSS(): void;
    getCorrectSourceMapPath(): string;
    /**
     *
     *
     * @private
     * @returns
     *
     * @memberOf File
     */
    private handleTypescript;
    cacheData: {
        [key: string]: any;
    };
    setCacheData(data: {
        [key: string]: any;
    }): void;
    generateCorrectSourceMap(fname?: string): any;
    /**
     * Provides a file-specific transpilation config.
     * This is needed so we can supply the filename to
     * the TypeScript compiler.
     *
     * @private
     * @returns
     *
     * @memberOf File
     */
    private getTranspilationConfig;
    addError(message: string): void;
}
