import { File } from "../../core/File";
import { Plugin, WorkFlowContext } from "../../core/WorkflowContext";
export interface CSSResourcePluginOptions {
    dist?: string;
    inline?: boolean;
    resolve?: (path: string) => any;
    macros?: any;
    resolveMissing?: any;
    useOriginalFilenames?: boolean;
    filesMapping?: (files: {
        from: string;
        to: string;
    }[]) => void;
}
/**
 * @export
 * @class RawPluginClass
 * @implements {Plugin}
 */
export declare class CSSResourcePluginClass implements Plugin {
    test: RegExp;
    distFolder: string;
    inlineImages: boolean;
    macros: any;
    resolveMissingFn: any;
    useOriginalFilenames: boolean;
    files: {};
    copiedFiles: {
        from: string;
        to: string;
    }[];
    filesMapping: (files: {
        from: string;
        to: string;
    }[]) => void;
    filesMappingNeedsToTrigger: boolean;
    constructor(opts?: CSSResourcePluginOptions);
    init(context: WorkFlowContext): void;
    resolveFn: (p: any) => string;
    createResourceFolder(file: File): void;
    transform(file: File): void;
    bundleEnd(producer: any): void;
}
export declare const CSSResourcePlugin: (options?: CSSResourcePluginOptions) => CSSResourcePluginClass;
