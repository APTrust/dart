import { File } from "../../core/File";
import { WorkFlowContext } from "../../core/WorkflowContext";
import { Plugin } from "../../core/WorkflowContext";
export interface CSSModulesOptions {
    useDefault?: boolean;
    scopedName?: string;
    paths?: string[];
    root?: string;
}
export declare class CSSModulesClass implements Plugin {
    test: RegExp;
    options: CSSModulesOptions;
    useDefault: boolean;
    scopedName: any;
    constructor(options?: CSSModulesOptions);
    init(context: WorkFlowContext): void;
    transform(file: File): Promise<any>;
}
export declare const CSSModulesPlugin: (options?: CSSModulesOptions) => CSSModulesClass;
export declare const CSSModules: typeof CSSModulesPlugin;
