import { File } from "../../core/File";
import { WorkFlowContext } from "../../core/WorkflowContext";
import { Plugin } from "../../core/WorkflowContext";
export interface StylusPluginOptions {
    sourcemap?: {
        [key: string]: boolean | string;
    };
}
/**
 * @export
 * @class StylusPluginClass
 * @implements {Plugin}
 */
export declare class StylusPluginClass implements Plugin {
    options: StylusPluginOptions;
    /**
     * @type {RegExp}
     * @memberOf StylusPluginClass
     */
    test: RegExp;
    constructor(options?: StylusPluginOptions);
    init(context: WorkFlowContext): void;
    transform(file: File): Promise<any>;
}
export declare const StylusPlugin: (options?: StylusPluginOptions) => StylusPluginClass;
