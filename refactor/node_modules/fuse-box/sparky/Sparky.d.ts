import { SparkTask } from "./SparkTask";
import { SparkFlow } from "./SparkFlow";
import { SparkyFilePatternOptions } from "./SparkyFilePattern";
import { Log } from "../Log";
import { SparkyContextClass } from "./SparkyContext";
import { FuseBoxOptions } from "../index";
export declare const log: Log;
export declare class Sparky {
    static launch: boolean;
    static testMode: boolean;
    static tasks: Map<string, SparkTask>;
    static flush(): void;
    /** Create a new task */
    static task(name: string, ...args: any[]): {
        help: (msg: string) => void;
    };
    static context(target: () => {
        [key: string]: any;
    } | (new () => any) | {
        [key: string]: any;
    }): SparkyContextClass;
    static src(glob: string | string[], opts?: SparkyFilePatternOptions): SparkFlow;
    static watch(glob: string | string[], opts?: SparkyFilePatternOptions, fn?: any): SparkFlow;
    static fuse(fn: (context: any) => FuseBoxOptions): void;
    static init(paths: string[]): SparkFlow;
    static exec(...args: Array<string | (() => any)>): Promise<void>;
    static start(tname?: string): Promise<any>;
    private static execute;
    private static resolve;
    private static showHelp;
}
