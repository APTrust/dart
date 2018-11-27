import { SparkyFile } from "./SparkyFile";
import { Plugin } from "../core/WorkflowContext";
import { SparkyFilePatternOptions } from "./SparkyFilePattern";
export declare class SparkFlow {
    private activities;
    private watcher;
    private files;
    private completedCallback;
    private initialWatch;
    constructor();
    glob(globs: string[], opts?: SparkyFilePatternOptions): SparkFlow;
    createFiles(paths: string[]): void;
    stopWatching(): void;
    watch(globs: string[], opts?: SparkyFilePatternOptions, fn?: any): SparkFlow;
    completed(fn: any): SparkFlow;
    /** Gets all user files */
    protected getFiles(globs: string[], opts?: SparkyFilePatternOptions): Promise<SparkyFile[]>;
    protected getFile(globString: any, opts?: SparkyFilePatternOptions): Promise<{}>;
    /**
     * Removes folder if exists
     * @param dest
     */
    clean(dest: string): SparkFlow;
    plugin(plugin: Plugin): SparkFlow;
    each(fn: (file: SparkyFile) => void): this;
    file(mask: string, fn: any): this;
    next(fn: (file: SparkyFile) => void): this;
    dest(dest: string): SparkFlow;
    exec(): Promise<void>;
}
