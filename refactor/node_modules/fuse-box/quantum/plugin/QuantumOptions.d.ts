import { WebIndexPluginClass } from "../../plugins/WebIndexPlugin";
import { QuantumCore } from "./QuantumCore";
import { FileAbstraction } from "../core/FileAbstraction";
import { BundleProducer, Bundle } from "../../index";
export interface ITreeShakeOptions {
    shouldRemove: {
        (file: FileAbstraction): void;
    };
}
export interface IQuantumExtensionParams {
    target?: string;
    uglify?: any;
    removeExportsInterop?: boolean;
    removeUseStrict?: boolean;
    replaceTypeOf?: boolean;
    replaceProcessEnv?: boolean;
    webIndexPlugin?: WebIndexPluginClass;
    ensureES5?: boolean;
    treeshake?: boolean | ITreeShakeOptions;
    api?: {
        (core: QuantumCore): void;
    };
    warnings?: boolean;
    bakeApiIntoBundle?: string | string[] | true;
    shimsPath?: string;
    globalRequire?: boolean;
    extendServerImport?: boolean;
    polyfills?: string[];
    definedExpressions?: {
        [key: string]: boolean | string | number;
    };
    processPolyfill?: boolean;
    css?: {
        path?: string;
        clean?: boolean;
    } | boolean;
    cssFiles?: {
        [key: string]: string;
    };
    hoisting?: boolean | {
        names: string[];
    };
    containedAPI?: boolean;
    noConflictApi?: boolean;
    manifest?: boolean | string;
    runtimeBundleMapping?: string;
}
export declare class QuantumOptions {
    producer: BundleProducer;
    private uglify;
    private removeExportsInterop;
    private removeUseStrict;
    private ensureES5;
    private replaceProcessEnv;
    private containedAPI;
    private processPolyfill;
    private bakeApiIntoBundle;
    private noConflictApi;
    private replaceTypeOf;
    private showWarnings;
    private treeshakeOptions;
    private hoisting;
    private polyfills;
    globalRequire: boolean;
    private hoistedNames;
    private extendServerImport;
    private manifestFile;
    shimsPath: string;
    apiCallback: {
        (core: QuantumCore): void;
    };
    optsTarget: string;
    treeshake: boolean;
    private cleanCSS;
    private css;
    private cssPath;
    private readonly cssFiles;
    quantumVariableName: string;
    definedExpressions: {
        [key: string]: boolean | string | number;
    };
    webIndexPlugin: WebIndexPluginClass;
    runtimeBundleMapping: string;
    constructor(producer: BundleProducer, opts: IQuantumExtensionParams);
    shouldSetBundleMappingsAtRuntime(): boolean;
    shouldGenerateCSS(): true | {
        [key: string]: string;
    };
    getCleanCSSOptions(): any;
    getCSSPath(): string;
    getCSSFiles(): {
        [key: string]: string;
    };
    getCSSSourceMapsPath(): string;
    genenerateQuantumVariableName(): void;
    shouldBundleProcessPolyfill(): boolean;
    enableContainedAPI(): boolean;
    shouldReplaceTypeOf(): boolean;
    getPromisePolyfill(): string;
    getManifestFilePath(): string;
    canBeRemovedByTreeShaking(file: FileAbstraction): true | void;
    isContained(): boolean;
    throwContainedAPIError(): void;
    shouldRemoveUseStrict(): boolean;
    shouldEnsureES5(): boolean;
    shouldDoHoisting(): boolean;
    getHoistedNames(): string[];
    isHoistingAllowed(name: string): boolean;
    shouldExtendServerImport(): boolean;
    shouldShowWarnings(): boolean;
    shouldUglify(): any;
    shouldCreateApiBundle(): boolean;
    shouldBakeApiIntoBundle(bundleName: string): boolean;
    getMissingBundles(bundles: Map<string, Bundle>): string[];
    shouldTreeShake(): boolean;
    shouldRemoveExportsInterop(): boolean;
    shouldReplaceProcessEnv(): boolean;
    getTarget(): string;
    isTargetElectron(): boolean;
    isTargetUniveral(): boolean;
    isTargetNpm(): boolean;
    isTargetServer(): boolean;
    isTargetBrowser(): boolean;
}
