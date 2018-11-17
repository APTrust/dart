import { File } from "../../core/File";
import { WorkFlowContext, Plugin } from "../../core/WorkflowContext";
export interface SassPluginOptions {
    includePaths?: string[];
    macros?: {
        [key: string]: string;
    };
    importer?: boolean | ImporterFunc;
    cache?: boolean;
    header?: string;
    resources?: [{
        test: RegExp;
        file: string;
    }];
    indentedSyntax?: boolean;
    functions?: {
        [key: string]: (...args: any[]) => any;
    };
}
export interface ImporterFunc {
    (url: string, prev: string, done: (opts: {
        url?: string;
        file?: string;
    }) => any): any;
}
/**
 * @export
 * @class SassPlugin
 * @implements {Plugin}
 */
export declare class SassPluginClass implements Plugin {
    options: SassPluginOptions;
    test: RegExp;
    context: WorkFlowContext;
    constructor(options?: SassPluginOptions);
    init(context: WorkFlowContext): void;
    transform(file: File): Promise<any>;
}
export declare const SassPlugin: (options?: SassPluginOptions) => SassPluginClass;
