import { CustomTransformers } from "typescript";
import { Server, ServerOptions } from "./../devServer/Server";
import { WorkFlowContext, Plugin } from "./WorkflowContext";
import { CollectionSource } from "./../CollectionSource";
import { BundleData } from "./../arithmetic/Arithmetic";
import { BundleProducer } from "./BundleProducer";
import { Bundle } from "./Bundle";
import { File } from "./File";
export interface FuseBoxOptions {
    homeDir?: string;
    modulesFolder?: string | string[];
    tsConfig?: string;
    package?: string | {
        name: string;
        main: string;
    };
    dynamicImportsEnabled?: boolean;
    cache?: boolean;
    /**
     * "browser" | "server" | "universal" | "electron"
     *
     * Combine target and language version with an '@'
     *
     * eg. server@es2017
     *
     * default: "universal@es5"
     */
    target?: string;
    log?: {
        enabled?: boolean;
        showBundledFiles?: boolean;
        clearTerminalOnBundle?: boolean;
    } | boolean;
    globals?: {
        [packageName: string]: string;
    };
    plugins?: Array<Plugin | Array<Plugin | string>>;
    autoImport?: any;
    natives?: any;
    warnings?: boolean;
    shim?: any;
    writeBundles?: boolean;
    useTypescriptCompiler?: boolean;
    standalone?: boolean;
    sourceMaps?: boolean | {
        vendor?: boolean;
        inlineCSSPath?: string;
        inline?: boolean;
        project?: boolean;
        sourceRoot?: string;
    };
    hash?: string | boolean;
    ignoreModules?: string[];
    customAPIFile?: string;
    output?: string;
    emitHMRDependencies?: boolean;
    filterFile?: (file: File) => boolean;
    automaticAlias?: boolean;
    allowSyntheticDefaultImports?: boolean;
    debug?: boolean;
    files?: any;
    alias?: any;
    useJsNext?: boolean | string[];
    stdin?: boolean;
    ensureTsConfig?: boolean;
    runAllMatchedPlugins?: boolean;
    showErrors?: boolean;
    showErrorsInBrowser?: boolean;
    polyfillNonStandardDefaultUsage?: boolean | string[];
    transformers?: CustomTransformers;
    extensionOverrides?: string[];
}
/**
 *
 *
 * @export
 * @class FuseBox
 */
export declare class FuseBox {
    opts?: FuseBoxOptions;
    static init(opts?: FuseBoxOptions): FuseBox;
    virtualFiles: any;
    collectionSource: CollectionSource;
    context: WorkFlowContext;
    producer: BundleProducer;
    /**
     * Creates an instance of FuseBox.
     *
     * @param {*} opts
     *
     * @memberOf FuseBox
     */
    constructor(opts?: FuseBoxOptions);
    triggerPre(): void;
    triggerStart(): void;
    triggerEnd(): void;
    triggerPost(): void;
    copy(): FuseBox;
    bundle(name: string, arithmetics?: string): Bundle;
    sendPageReload(): void;
    sendPageHMR(): void;
    /** Starts the dev server and returns it */
    dev(opts?: ServerOptions, fn?: (server: Server) => void): void;
    /** Top priority is to register packages first */
    register(packageName: string, opts: any): void;
    run(opts?: any): Promise<BundleProducer>;
    process(bundleData: BundleData, bundleReady?: () => any): Promise<import("../Utils").Concat>;
    addShims(): void;
    initiateBundle(str: string, bundleReady?: any): Promise<import("../Utils").Concat>;
}
