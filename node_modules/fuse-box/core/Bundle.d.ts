/// <reference types="node" />
import { FuseBox } from "./FuseBox";
import { WorkFlowContext } from "./WorkflowContext";
import { BundleProducer } from "./BundleProducer";
import { FuseProcess } from "../FuseProcess";
import { File } from "./File";
import { QuantumSplitResolveConfiguration } from "../quantum/plugin/QuantumSplit";
import { BundleAbstraction } from "../quantum/core/BundleAbstraction";
import { PackageAbstraction } from "../quantum/core/PackageAbstraction";
import { QuantumBit } from "../quantum/plugin/QuantumBit";
declare type WatchFilterFn = (path: string) => boolean;
export interface HMROptions {
    port?: number;
    socketURI?: string;
    reload?: boolean;
}
export declare class Bundle {
    name: string;
    fuse: FuseBox;
    producer: BundleProducer;
    context: WorkFlowContext;
    watchRule: string;
    watchFilterFn?: WatchFilterFn;
    arithmetics: string;
    process: FuseProcess;
    onDoneCallback: any;
    webIndexPriority: number;
    generatedCode: Buffer;
    bundleAbstraction: BundleAbstraction;
    packageAbstraction: PackageAbstraction;
    lastChangedFile: string;
    webIndexed: boolean;
    splitFiles: Map<string, File>;
    quantumBit: QuantumBit;
    private errors;
    private errorEmitter;
    private clearErrorEmitter;
    constructor(name: string, fuse: FuseBox, producer: BundleProducer);
    watch(ruleOrFilterFn?: string | WatchFilterFn, filterFn?: WatchFilterFn): Bundle;
    globals(globals: any): Bundle;
    tsConfig(fpath: string): Bundle;
    shim(shimConfig: any): Bundle;
    /** Enable HMR in this bundle and inject HMR plugin */
    hmr(opts?: HMROptions): Bundle;
    alias(key: any, value: any): Bundle;
    split(name: string, filePath: string): Bundle;
    /** Override cache option */
    cache(cache: boolean): Bundle;
    splitConfig(opts: QuantumSplitResolveConfiguration): Bundle;
    /** Log */
    log(log: boolean): Bundle;
    extensionOverrides(...overrides: string[]): this;
    /**
     * Adds a plugin or a chain of plugins
     * e.g
     * in case of one plugin
     * plugin(HTMLPlugin())
     * In case of a chain:
     *
     * plugin("*.html", HTMLPlugin())
     * @param args Plugin
     */
    plugin(...args: any[]): Bundle;
    /**
     * natives({ process : false })
     * @param opts
     */
    natives(opts: any): Bundle;
    instructions(arithmetics: string): Bundle;
    target(target: string): Bundle;
    sourceMaps(params: any): Bundle;
    test(str: string, opts: any): void;
    exec(): Promise<Bundle>;
    completed(fn: (process: FuseProcess) => void): Bundle;
    private setup;
    private clearErrors;
    addError(message: string): void;
    getErrors(): string[];
    printErrors(): void;
}
export {};
