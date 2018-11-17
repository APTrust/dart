/// <reference types="node" />
import { Readable } from 'stream';
import { Logger } from './logger';
import { NexeOptions } from './options';
import { NexeTarget } from './target';
export interface NexeFile {
    filename: string;
    absPath: string;
    contents: string;
}
export { NexeOptions };
export declare class NexeCompiler<T extends NexeOptions = NexeOptions> {
    options: T;
    private start;
    private env;
    private compileStep;
    log: Logger;
    src: string;
    files: NexeFile[];
    shims: string[];
    input: string;
    bundledInput?: string;
    targets: NexeTarget[];
    target: NexeTarget;
    resources: {
        bundle: Buffer;
        index: {
            [key: string]: number[];
        };
    };
    output: string;
    private nodeSrcBinPath;
    constructor(options: T);
    addResource(file: string, contents: Buffer): void;
    readFileAsync(file: string): Promise<NexeFile>;
    writeFileAsync(file: string, contents: string | Buffer): Promise<any>;
    replaceInFileAsync(file: string, replace: string | RegExp, value: string): Promise<void>;
    setFileContentsAsync(file: string, contents: string): Promise<void>;
    quit(): Promise<{}>;
    assertBuild(): void;
    getNodeExecutableLocation(target?: NexeTarget): string;
    private _runBuildCommandAsync(command, args);
    private _configureAsync();
    private _buildAsync();
    private _fetchPrebuiltBinaryAsync(target);
    getHeader(): string;
    compileAsync(target: NexeTarget): Promise<NodeJS.ReadableStream | Readable>;
    code(): string;
    private _assembleDeliverable(binary);
}
