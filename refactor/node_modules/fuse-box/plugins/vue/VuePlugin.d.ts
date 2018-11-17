import { File } from "../../core/File";
import { WorkFlowContext, Plugin } from "../../core/WorkflowContext";
export interface IVueComponentPluginOptions {
    script?: Plugin[];
    template?: Plugin[];
    style?: Plugin[];
}
export declare class VueComponentClass implements Plugin {
    dependencies: ["process", "fusebox-hot-reload"];
    test: RegExp;
    options: IVueComponentPluginOptions;
    hasProcessedVueFile: boolean;
    constructor(options: IVueComponentPluginOptions);
    init(context: WorkFlowContext): void;
    private getDefaultExtension;
    private createVirtualFile;
    private addToCacheObject;
    private isFileInCacheData;
    bundleEnd(context: WorkFlowContext): void;
    transform(file: File): Promise<void>;
}
export declare const VueComponentPlugin: (options?: any) => VueComponentClass;
