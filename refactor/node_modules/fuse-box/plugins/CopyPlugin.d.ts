import { File } from "../core/File";
import { Plugin, WorkFlowContext } from "../core/WorkflowContext";
export interface CopyPluginOptions {
    files?: string[];
    useDefault?: boolean;
    dest?: string;
    resolve?: string;
}
/**
 * @export
 * @class AssetPluginClass
 * @implements {Plugin}
 */
export declare class CopyPluginClass implements Plugin {
    options: CopyPluginOptions;
    extensions: Array<string>;
    test: RegExp;
    private useDefault;
    private resolve;
    private dest;
    constructor(options?: CopyPluginOptions);
    init(context: WorkFlowContext): void;
    transform(file: File): Promise<{}>;
}
export declare const CopyPlugin: (options?: CopyPluginOptions) => CopyPluginClass;
