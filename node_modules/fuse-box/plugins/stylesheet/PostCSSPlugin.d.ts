import { File } from "../../core/File";
import { WorkFlowContext } from "../../core/WorkflowContext";
import { Plugin } from "../../core/WorkflowContext";
export interface PostCSSPluginOptions {
    [key: string]: any;
    paths?: string[];
    sourceMaps?: boolean;
}
export declare type Processors = (() => any)[];
/**
 *
 *
 * @export
 * @class FuseBoxCSSPlugin
 * @implements {Plugin}
 */
export declare class PostCSSPluginClass implements Plugin {
    processors: Processors;
    options: PostCSSPluginOptions;
    /**
     *
     *
     * @type {RegExp}
     * @memberOf FuseBoxCSSPlugin
     */
    test: RegExp;
    dependencies: any[];
    constructor(processors?: Processors, options?: PostCSSPluginOptions);
    /**
     *
     *
     * @param {WorkFlowContext} context
     *
     * @memberOf FuseBoxCSSPlugin
     */
    init(context: WorkFlowContext): void;
    /**
     *
     *
     * @param {File} file
     *
     * @memberOf FuseBoxCSSPlugin
     */
    transform(file: File): any;
}
declare function PostCSS(processors?: Processors, opts?: PostCSSPluginOptions): any;
declare function PostCSS(options?: PostCSSPluginOptions): any;
export { PostCSS };
