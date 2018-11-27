/// <reference types="node" />
import { BundleSource } from "../BundleSource";
import { File, ScriptTarget } from "./File";
import { Log } from "../Log";
import * as NativeEmitter from "events";
import { IPackageInformation } from "./PathMaster";
import { ModuleCollection } from "./ModuleCollection";
import { ModuleCache } from "../ModuleCache";
import { EventEmitter } from "../EventEmitter";
import { SourceChangedEvent } from "../devServer/Server";
import { Defer } from "../Defer";
import { UserOutput } from "./UserOutput";
import { FuseBox } from "./FuseBox";
import { Bundle } from "./Bundle";
import { BundleProducer } from "./BundleProducer";
import { QuantumSplitConfig, QuantumSplitResolveConfiguration } from "../quantum/plugin/QuantumSplit";
import { ICSSDependencyExtractorOptions } from "../lib/CSSDependencyExtractor";
import { ExtensionOverrides } from "./ExtensionOverrides";
import { TypescriptConfig } from "./TypescriptConfig";
import { QuantumBit } from "../quantum/plugin/QuantumBit";
/**
 * All the plugin method names
 */
export declare type PluginMethodName = "init" | "preBuild" | "preBundle" | "bundleStart" | "bundleEnd" | "postBundle" | "postBuild";
/**
 * Interface for a FuseBox plugin
 */
export interface Plugin {
    test?: RegExp;
    options?: any;
    init?(context: WorkFlowContext): any;
    transform?(file: File, ast?: any): any;
    transformGroup?(file: File): any;
    onTypescriptTransform?(file: File): any;
    bundleStart?(context: WorkFlowContext): any;
    bundleEnd?(context: WorkFlowContext): any;
    producerEnd?(producer: BundleProducer): any;
    onSparky?(): any;
    /**
     * If provided then the dependencies are loaded on the client
     *  before the plugin is invoked
     */
    dependencies?: string[];
}
/**
 * Gets passed to each plugin to track FuseBox configuration
 */
export declare class WorkFlowContext {
    /**
     * defaults to app-root-path, but can be set by user
     * @see FuseBox
     */
    appRoot: any;
    cacheBustPreffix: string;
    dynamicImportsEnabled: boolean;
    automaticAlias: boolean;
    shim: any;
    writeBundles: boolean;
    fuse: FuseBox;
    useTypescriptCompiler: boolean;
    userWriteBundles: boolean;
    showWarnings: boolean;
    ensureTsConfig: boolean;
    useJsNext: boolean | string[];
    showErrors: boolean;
    showErrorsInBrowser: boolean;
    sourceChangedEmitter: EventEmitter<SourceChangedEvent>;
    emitter: NativeEmitter;
    quantumBits: Map<string, QuantumBit>;
    /**
     * The default package name or the package name configured in options
     */
    defaultPackageName: string;
    transformTypescript?: (contents: string) => string;
    ignoreGlobal: string[];
    pendingPromises: Promise<any>[];
    emitHMRDependencies: boolean;
    languageLevel: ScriptTarget;
    forcedLanguageLevel: ScriptTarget;
    filterFile: {
        (file: File): boolean;
    };
    customAPIFile: string;
    defaultEntryPoint: string;
    output: UserOutput;
    extensionOverrides?: ExtensionOverrides;
    hash: string | Boolean;
    target: string;
    inlineCSSPath: string;
    /**
     * Explicitly target bundle to server
     */
    serverBundle: boolean;
    nodeModules: Map<string, ModuleCollection>;
    libPaths: Map<string, IPackageInformation>;
    homeDir: string;
    printLogs: boolean;
    runAllMatchedPlugins: boolean;
    plugins: Plugin[];
    fileGroups: Map<string, File>;
    useCache: boolean;
    doLog: boolean;
    cache: ModuleCache;
    tsConfig: TypescriptConfig;
    customModulesFolder: string[];
    tsMode: boolean;
    loadedTsConfig: string;
    dependents: Map<string, Set<string>>;
    globals: {
        [packageName: string]: string;
    };
    standaloneBundle: boolean;
    source: BundleSource;
    sourceMapsProject: boolean;
    sourceMapsVendor: boolean;
    inlineSourceMaps: boolean;
    sourceMapsRoot: string;
    useSourceMaps: boolean;
    initialLoad: boolean;
    debugMode: boolean;
    quantumSplitConfig: QuantumSplitConfig;
    log: Log;
    pluginTriggers: Map<string, Set<String>>;
    natives: {
        process: boolean;
        stream: boolean;
        Buffer: boolean;
        http: boolean;
    };
    autoImportConfig: {};
    bundle: Bundle;
    storage: Map<string, any>;
    aliasCollection: any[];
    experimentalAliasEnabled: boolean;
    customCodeGenerator: any;
    defer: Defer;
    cacheType: string;
    initCache(): void;
    resolve(): Promise<void>;
    queue(obj: any): void;
    convertToFuseBoxPath(name: string): string;
    isBrowserTarget(): boolean;
    shouldUseJsNext(libName: string): boolean;
    nameSplit(name: string, filePath: string): void;
    configureQuantumSplitResolving(opts: QuantumSplitResolveConfiguration): void;
    setCodeGenerator(fn: any): void;
    generateCode(ast: any, opts?: any): any;
    replaceAliases(requireStatement: string): {
        requireStatement: string;
        replaced: boolean;
    };
    emitJavascriptHotReload(file: File): void;
    debug(group: string, text: string): void;
    nukeCache(): void;
    setSourceMapsProperty(params: any): void;
    warning(str: string): Log;
    deprecation(str: string): void;
    fatal(str: string): void;
    debugPlugin(plugin: Plugin, text: string): void;
    isShimed(name: string): boolean;
    isHashingRequired(): boolean;
    /**
     * Resets significant class members
     */
    reset(): void;
    registerDependant(target: File, dependant: File): void;
    initAutoImportConfig(userNatives: any, userImports: any): void;
    setItem(key: string, obj: any): void;
    getItem(key: string, defaultValue?: any): any;
    setCSSDependencies(file: File, userDeps: string[]): void;
    extractCSSDependencies(file: File, opts: ICSSDependencyExtractorOptions): string[];
    getCSSDependencies(file: File): string[];
    /**
     * Create a new file group
     * Mocks up file
     */
    createFileGroup(name: string, collection: ModuleCollection, handler: Plugin): File;
    getFileGroup(name: string): File;
    allowExtension(ext: string): void;
    addAlias(obj: any, value?: any): void;
    setHomeDir(dir: string): void;
    setLibInfo(name: string, version: string, info: IPackageInformation): Map<string, IPackageInformation>;
    /** Converts the file extension from `.ts` to `.js` */
    convert2typescript(name: string): string;
    getLibInfo(name: string, version: string): IPackageInformation;
    setPrintLogs(printLogs: boolean): void;
    setUseCache(useCache: boolean): void;
    hasNodeModule(name: string): boolean;
    isGlobalyIgnored(name: string): boolean;
    resetNodeModules(): void;
    addNodeModule(name: string, collection: ModuleCollection): void;
    isFirstTime(): boolean;
    writeOutput(outFileWritten?: () => any): void;
    protected writeSourceMaps(result: any): void;
    getNodeModule(name: string): ModuleCollection;
    /**
     * @param fn if provided, its called once the plugin method has been triggered
     */
    triggerPluginsMethodOnce(name: PluginMethodName, args: any, fn?: {
        (plugin: Plugin): void;
    }): void;
    /**
     * Makes sure plugin method is triggered only once
     * @returns true if the plugin needs triggering
     */
    private pluginRequiresTriggering;
}
