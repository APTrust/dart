import { File } from "../core/File";
import { WorkFlowContext } from "../core/WorkflowContext";
import { Plugin } from "../core/WorkflowContext";
export interface VuePluginOptions {
    babel?: any;
}
export declare class VuePluginClass implements Plugin {
    options: VuePluginOptions;
    test: RegExp;
    constructor(options?: VuePluginOptions);
    init(context: WorkFlowContext): void;
    transform(file: File): Promise<boolean | void>;
}
export declare const VuePlugin: (options?: VuePluginOptions) => VuePluginClass;
