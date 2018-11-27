/// <reference types="node" />
import { Plugin } from "../core/WorkflowContext";
export declare class SparkyFile {
    homePath: string;
    name: string;
    contents: Buffer | string;
    extension: string;
    filepath: string;
    root: string;
    private savingRequired;
    constructor(filepath: string, root: string);
    read(): SparkyFile;
    write(contents: string | Buffer): SparkyFile;
    template(obj: any): void;
    save(): SparkyFile;
    ext(ext: string): SparkyFile;
    json(fn: any): SparkyFile;
    plugin(plugin: Plugin): void;
    setContent(cnt: string): SparkyFile;
    rename(name: string): SparkyFile;
    copy(dest: string): Promise<{}>;
}
