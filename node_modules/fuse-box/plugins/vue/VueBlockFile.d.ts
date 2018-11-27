import { File } from "../../core/File";
import { Plugin } from "../../core/WorkflowContext";
import { IPathInformation } from "../../core/PathMaster";
export declare abstract class VueBlockFile extends File {
    file: File;
    info: IPathInformation;
    block: any;
    scopeId: string;
    pluginChain: Plugin[];
    constructor(file: File, info: IPathInformation, block: any, scopeId: string, pluginChain: Plugin[]);
    setPluginChain(block: any, pluginChain: Plugin[]): Promise<never>;
    loadContents(): void;
    abstract process(): Promise<void>;
}
