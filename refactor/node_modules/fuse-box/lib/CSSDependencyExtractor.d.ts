export interface ICSSDependencyExtractorOptions {
    paths: string[];
    extensions: string[];
    content: string;
    sassStyle?: boolean;
    importer?: {
        (f: string, prev: any, done: {
            (info: {
                file: string;
            }): void;
        }): string;
    };
}
export declare class CSSDependencyExtractor {
    opts: ICSSDependencyExtractorOptions;
    private filesProcessed;
    private dependencies;
    constructor(opts: ICSSDependencyExtractorOptions);
    private extractDepsFromString;
    private readFile;
    getDependencies(): string[];
    private tryFile;
    private getPath;
    private findTarget;
    static init(opts: ICSSDependencyExtractorOptions): CSSDependencyExtractor;
}
