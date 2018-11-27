import { File } from "../../core/File";
import { WorkFlowContext } from "../../core/WorkflowContext";
import { Plugin } from "../../core/WorkflowContext";
/**
 * @tutorial https://buble.surge.sh/guide/#options
 * @export
 * @class FuseBoxBublePlugin
 * @implements {Plugin}
 */
export declare class BublePluginClass implements Plugin {
    test: RegExp;
    context: WorkFlowContext;
    private config?;
    private configPrinted;
    /**
     * @param {any} config BubleOptions + .test
     */
    constructor(config: any);
    /**
     * @param {WorkFlowContext} context
     */
    init(context: WorkFlowContext): void;
    /**
     * @param {File} file
     */
    transform(file: File, ast: any): void;
}
export declare const BublePlugin: (opts: any) => BublePluginClass;
