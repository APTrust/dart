/// <reference types="node" />
import { Bundle } from "./core/Bundle";
import { ChildProcess } from "child_process";
export declare class FuseProcess {
    bundle: Bundle;
    node: ChildProcess;
    filePath: string;
    constructor(bundle: Bundle);
    setFilePath(filePath: string): void;
    /** Kills a process if exists */
    kill(): void;
    /** Starts a process (for example express server) */
    start(): FuseProcess;
    require(opts?: {
        close?: ((fuseBox: any) => void);
    }): Promise<{}>;
    /** Spawns another proces */
    exec(): FuseProcess;
}
