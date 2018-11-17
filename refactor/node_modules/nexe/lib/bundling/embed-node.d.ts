export interface EmbedNodeModuleOptions {
    [key: string]: {
        additionalFiles: string[];
    } | true;
}
export declare function embedDotNode(options: EmbedNodeModuleOptions, file: {
    contents: string;
    absPath: string;
}): {} | undefined;
