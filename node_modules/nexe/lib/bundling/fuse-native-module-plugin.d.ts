import { EmbedNodeModuleOptions } from './embed-node';
export interface FuseBoxFile {
    info: {
        absPath: string;
    };
    absPath: string;
    contents: string;
    analysis: {
        dependencies: string[];
        requiresRegeneration: boolean;
    };
    consume(): void;
    loadContents(): void;
    makeAnalysis(parsingOptions?: any, traversalPlugin?: {
        plugins: Array<{
            onNode(file: FuseBoxFile, node: any, parent: any): void;
            onEnd(file: FuseBoxFile): void;
        }>;
    }): void;
}
export default function (options?: EmbedNodeModuleOptions): NativeModulePlugin;
export declare class NativeModulePlugin {
    options: {};
    test: RegExp;
    limit2Project: boolean;
    private modules;
    constructor(options?: {});
    init(context: any): void;
    transform(file: FuseBoxFile): void;
}
