import { File } from "../../core/File";
import { WorkFlowContext, Plugin } from "../../core/WorkflowContext";
export interface ImageBase64PluginOptions {
    useDefault?: boolean;
}
/**
 *
 *
 * @export
 * @class FuseBoxHTMLPlugin
 * @implements {Plugin}
 */
export declare class ImageBase64PluginClass implements Plugin {
    opts: ImageBase64PluginOptions;
    constructor(opts?: ImageBase64PluginOptions);
    /**
     *
     *
     * @type {RegExp}
     * @memberOf FuseBoxHTMLPlugin
     */
    test: RegExp;
    /**
     *
     *
     * @param {WorkFlowContext} context
     *
     * @memberOf FuseBoxHTMLPlugin
     */
    init(context: WorkFlowContext): void;
    /**
     *
     *
     * @param {File} file
     *
     * @memberOf FuseBoxHTMLPlugin
     */
    transform(file: File): void;
}
export declare const ImageBase64Plugin: (opts?: ImageBase64PluginOptions) => ImageBase64PluginClass;
