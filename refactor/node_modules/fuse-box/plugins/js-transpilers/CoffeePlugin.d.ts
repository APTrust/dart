import { WorkFlowContext } from "../../core/WorkflowContext";
import { Plugin } from "../../core/WorkflowContext";
import { File } from "../../core/File";
export interface CoffeePluginOptions {
    bare?: boolean;
    sourceMap?: boolean;
    sourceRoot?: string;
    literate?: boolean;
    filename?: boolean;
    sourceFiles?: boolean;
    generatedFile?: boolean;
}
/**
 * This plugin compile coffeescript to Javascript
 *
 * @export
 * @class CoffeePluginClass
 * @implements {Plugin}
 */
export declare class CoffeePluginClass implements Plugin {
    test: RegExp;
    options: CoffeePluginOptions;
    /**
     * @param {Object} options - Options for coffee compiler
     */
    constructor(options?: CoffeePluginOptions);
    init(context: WorkFlowContext): void;
    transform(file: File): Promise<{}>;
}
export declare const CoffeePlugin: (options?: CoffeePluginOptions) => CoffeePluginClass;
