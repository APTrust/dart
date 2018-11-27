import { WorkFlowContext } from "../core/WorkflowContext";
export declare class OptimizeJSClass {
    test: RegExp;
    opts?: Object | any;
    context: WorkFlowContext;
    static init(config: any): OptimizeJSClass;
    constructor(opts?: any);
    init(context: WorkFlowContext): void;
    transform(file: any, ast: any): void;
}
export declare const OptimizeJSPlugin: typeof OptimizeJSClass.init;
