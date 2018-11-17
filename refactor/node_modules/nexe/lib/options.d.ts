/// <reference types="minimist" />
import * as parseArgv from 'minimist';
import { NexeCompiler } from './compiler';
import { NexeTarget } from './target';
export declare const version = "{{replace:0}}";
export interface NexePatch {
    (compiler: NexeCompiler, next: () => Promise<void>): Promise<void>;
}
export interface NexeOptions {
    build: boolean;
    input: string;
    output: string;
    targets: (string | NexeTarget)[];
    name: string;
    cwd: string;
    flags: string[];
    configure: string[];
    vcBuild: string[];
    make: string[];
    snapshot?: string;
    resources: string[];
    temp: string;
    rc: {
        [key: string]: string;
    };
    enableNodeCli: boolean;
    bundle: boolean | string;
    patches: (string | NexePatch)[];
    plugins: (string | NexePatch)[];
    native: any;
    empty: boolean;
    ghToken: string;
    sourceUrl?: string;
    enableStdIn?: boolean;
    python?: string;
    loglevel: 'info' | 'silent' | 'verbose';
    silent?: boolean;
    fakeArgv?: boolean;
    verbose?: boolean;
    info?: boolean;
    ico?: string;
    debugBundle?: boolean;
    warmup?: string;
    compress?: boolean;
    clean?: boolean;
    /**
     * Api Only
     */
    downloadOptions: any;
}
declare const argv: parseArgv.ParsedArgs;
declare let help: string;
export declare function resolveEntry(input: string, cwd: string, maybeEntry?: string): string;
declare function normalizeOptions(input?: Partial<NexeOptions>): NexeOptions;
export { argv, normalizeOptions, help };
