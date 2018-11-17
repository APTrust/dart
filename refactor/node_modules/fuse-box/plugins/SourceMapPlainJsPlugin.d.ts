import { File } from "../core/File";
import { WorkFlowContext } from "../core/WorkflowContext";
import { Plugin } from "../core/WorkflowContext";
export interface SourceMapPlainJsPluginOptions {
    ext?: string;
    test?: RegExp;
}
/**
 * @export
 * @class SourceMapPlainJsPluginClass
 * @implements {Plugin}
 */
export declare class SourceMapPlainJsPluginClass implements Plugin {
    /**
     * @type {RegExp}
     * @memberOf SourceMapPlainJsPluginClass
     */
    test: RegExp;
    /**
     * @type {string}
     * @memberOf SourceMapPlainJsPluginClass
     */
    ext: string;
    /**
     * @type {WorkFlowContext}
     * @memberOf SourceMapPlainJsPluginClass
     */
    private context;
    constructor(options?: SourceMapPlainJsPluginOptions);
    init(context: WorkFlowContext): void;
    transform(file: File): boolean;
    private getSourceMap;
}
export declare const SourceMapPlainJsPlugin: (options?: SourceMapPlainJsPluginOptions) => SourceMapPlainJsPluginClass;
