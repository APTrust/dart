import { WorkFlowContext } from "../core/WorkflowContext";
import { Plugin } from "../core/WorkflowContext";
export interface EnvPluginOptions {
    [key: string]: any;
}
/**
 * @export
 * @class BannerPluginClass
 * @implements {Plugin}
 */
export declare class EnvPluginClass implements Plugin {
    private env;
    constructor(env: EnvPluginOptions);
    bundleStart(context: WorkFlowContext): void;
}
export declare const EnvPlugin: (options: EnvPluginOptions) => EnvPluginClass;
