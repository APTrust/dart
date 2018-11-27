import { File } from "../../core/File";
import { WorkFlowContext } from "../../core/WorkflowContext";
import { Plugin } from "../../core/WorkflowContext";
export interface CSSPluginOptions {
    outFile?: {
        (file: string): string;
    } | string;
    inject?: boolean | {
        (file: string): string;
    };
    group?: string;
    minify?: boolean;
}
/**
 *
 *
 * @export
 * @class FuseBoxCSSPlugin
 * @implements {Plugin}
 */
export declare class CSSPluginClass implements Plugin {
    /**
     *
     *
     * @type {RegExp}
     * @memberOf FuseBoxCSSPlugin
     */
    test: RegExp;
    private minify;
    options: CSSPluginOptions;
    dependencies: ["fuse-box-css"];
    constructor(opts?: CSSPluginOptions);
    injectFuseModule(file: File): void;
    /**
     *
     *
     * @param {WorkFlowContext} context
     *
     * @memberOf FuseBoxCSSPlugin
     */
    init(context: WorkFlowContext): void;
    getFunction(): string;
    inject(file: File, options: any, alternative?: boolean): string;
    transformGroup(group: File): Promise<{}>;
    emitHMR(file: File, resolvedPath?: string): void;
    /**
     *
     *
     * @param {File} file
     *
     * @memberOf FuseBoxCSSPlugin
     */
    transform(file: File): Promise<void>;
    private minifyContents;
}
export declare const CSSPlugin: (opts?: CSSPluginOptions) => CSSPluginClass;
