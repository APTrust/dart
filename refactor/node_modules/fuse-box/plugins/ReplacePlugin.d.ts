import { File } from "../core/File";
import { Plugin } from "../core/WorkflowContext";
export interface ReplacePluginOptions {
    [key: string]: string;
}
export declare class ReplacePluginClass implements Plugin {
    options: ReplacePluginOptions;
    test: RegExp;
    extensions: Array<string>;
    constructor(options?: ReplacePluginOptions);
    transform(file: File): void;
}
export declare const ReplacePlugin: (options?: ReplacePluginOptions) => ReplacePluginClass;
