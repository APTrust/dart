import { FuseBox } from "./FuseBox";
import { Bundle } from "./Bundle";
export declare class BundleRunner {
    fuse: FuseBox;
    private topTasks;
    private bundles;
    private bottomTasks;
    constructor(fuse: FuseBox);
    top(fn: any): void;
    bottom(fn: any): void;
    bundle(bundle: Bundle): void;
    /** Execute top priority tasks */
    executeTop(): Promise<any[]>;
    executeBottom(): Promise<any[]>;
    executeBundles(runType: string): Promise<any>;
    /** Run all tasks */
    run(opts?: {
        runType?: string;
    }): Promise<any>;
}
