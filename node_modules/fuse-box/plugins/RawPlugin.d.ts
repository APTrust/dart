import { File } from "../core/File";
import { WorkFlowContext } from "../core/WorkflowContext";
import { Plugin } from "../core/WorkflowContext";
export interface RawPluginOptionsObj {
    extensions: string[];
}
export declare type RawPluginOptions = RawPluginOptionsObj | string[];
/**
 * @export
 * @class RawPluginClass
 * @implements {Plugin}
 */
export declare class RawPluginClass implements Plugin {
    /**
     * @type {RegExp}
     * @memberOf RawPluginClass
     */
    test: RegExp;
    /**
     * @type {Array<string>}
     * @memberOf RawPluginClass
     */
    extensions: Array<string>;
    constructor(options?: RawPluginOptions | string[]);
    init(context: WorkFlowContext): void;
    isRefreshRequired(file: File): boolean;
    transform(file: File): void;
}
export declare const RawPlugin: (options?: RawPluginOptions) => RawPluginClass;
