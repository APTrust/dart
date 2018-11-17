import { IPackageInformation, IPathInformation } from "./PathMaster";
import { WorkFlowContext } from "./WorkflowContext";
import { BundleData } from "../arithmetic/Arithmetic";
import { File } from "./File";
export interface INodeModuleRequire {
    name: string;
    fuseBoxPath?: string;
    target?: string;
}
export interface IPathInformation {
    fuseBoxAlias?: string;
    overrideStatement?: {
        key: string;
        value: string;
    };
    isRemoteFile?: boolean;
    remoteURL?: string;
    tsMode?: boolean;
    isNodeModule: boolean;
    nodeModuleName?: string;
    nodeModuleInfo?: IPackageInformation;
    nodeModuleExplicitOriginal?: string;
    absDir?: string;
    fuseBoxPath?: string;
    params?: Map<string, string>;
    absPath?: string;
}
export interface IPackageInformation {
    name: string;
    missing?: boolean;
    bundleData?: BundleData;
    entry: string;
    version: string;
    jsNext?: boolean;
    root: string;
    entryRoot: string;
    custom: boolean;
    browserOverrides?: any;
    customBelongsTo?: string;
}
/**
 * Manages the allowed extensions e.g.
 * should user be allowed to do `require('./foo.ts')`
 */
export declare class AllowedExtensions {
    /**
     * Users are allowed to require files with these extensions by default
     **/
    static list: Set<string>;
    static add(name: string): void;
    static has(name: any): boolean;
}
/**
 * PathMaster
 */
export declare class PathMaster {
    context: WorkFlowContext;
    rootPackagePath?: string;
    private tsMode;
    private fuseBoxAlias;
    constructor(context: WorkFlowContext, rootPackagePath?: string);
    init(name: string, fuseBoxPath?: string): IPathInformation;
    setTypeScriptMode(): void;
    resolve(name: string, root?: string, rootEntryLimit?: string, parent?: File): IPathInformation;
    getFuseBoxPath(name: string, root: string): string;
    /**
     * Make sure that all extensions are in place
     * Returns a valid absolute path
     *
     * @param {string} name
     * @param {string} root
     * @returns
     *
     * @memberOf PathMaster
     */
    getAbsolutePath(name: string, root: string, rootEntryLimit?: string, explicit?: boolean): {
        resolved: string;
        alias?: string;
    };
    getParentFolderName(): string;
    private testFolder;
    private checkFileName;
    private ensureNodeModuleExtension;
    private extractRelativeFuseBoxPath;
    private ensureFolderAndExtensions;
    private getNodeModuleInfo;
    private fixBrowserOverrides;
    private getNodeModuleInformation;
}
