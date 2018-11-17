import { Plugin, WorkFlowContext } from "../core/WorkflowContext";
export interface UglifyJSPluginOptions {
    [key: string]: any;
}
/**
 * @export
 * @class UglifyJSPluginClass
 * @implements {Plugin}
 */
export declare class UglifyJSPluginClass implements Plugin {
    options: UglifyJSPluginOptions;
    /**
     * @type {any}
     * @memberOf UglifyJSPluginClass
     */
    constructor(options?: UglifyJSPluginOptions);
    postBundle(context: WorkFlowContext): Promise<never>;
}
export declare const UglifyJSPlugin: (options?: UglifyJSPluginOptions) => UglifyJSPluginClass;
