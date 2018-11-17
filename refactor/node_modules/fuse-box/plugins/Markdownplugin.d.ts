import { File } from "../core/File";
import { WorkFlowContext } from "../core/WorkflowContext";
import { Plugin } from "../core/WorkflowContext";
export interface MarkdownPluginOptions {
    gfm?: boolean;
    tables?: boolean;
    breaks?: boolean;
    pedantic?: boolean;
    sanitize?: boolean;
    smartLists?: boolean;
    smartypants?: boolean;
    useDefault?: boolean;
    renderer?: () => any;
}
/**
 *
 *
 * @export
 * @class FuseBoxMarkdownPlugin
 * @implements {Plugin}
 */
export declare class FuseBoxMarkdownPlugin implements Plugin {
    private useDefault;
    options: MarkdownPluginOptions;
    constructor(opts?: MarkdownPluginOptions);
    /**
     *
     *
     * @type {RegExp}
     * @memberOf FuseBoxMarkdownPlugin
     */
    test: RegExp;
    /**
     *
     *
     * @param {WorkFlowContext} context
     *
     * @memberOf FuseBoxMarkdownPlugin
     */
    init(context: WorkFlowContext): void;
    /**
     *
     *
     * @param {File} file
     *
     * @memberOf FuseBoxMarkdownPlugin
     */
    transform(file: File): void;
}
export declare const MarkdownPlugin: (options?: MarkdownPluginOptions) => FuseBoxMarkdownPlugin;
