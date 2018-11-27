import { Plugin } from "../core/WorkflowContext";
export interface UglifyESPluginOptions {
    [key: string]: any;
}
/**
 * @export
 * @class UglifyESPluginClass
 * @implements {Plugin}
 */
export declare class UglifyESPluginClass implements Plugin {
    options: UglifyESPluginOptions;
    /**
     * @type {any}
     * @memberOf UglifyESPluginClass
     */
    constructor(options?: UglifyESPluginOptions);
    postBundle(context: any): void;
}
export declare const UglifyESPlugin: (options?: UglifyESPluginOptions) => UglifyESPluginClass;
