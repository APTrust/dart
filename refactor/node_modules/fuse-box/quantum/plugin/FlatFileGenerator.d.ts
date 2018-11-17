import { FileAbstraction } from "../core/FileAbstraction";
import { QuantumCore } from "./QuantumCore";
import { BundleAbstraction } from "../core/BundleAbstraction";
export declare class FlatFileGenerator {
    core: QuantumCore;
    bundleAbstraction?: BundleAbstraction;
    contents: any[];
    entryId: any;
    globals: Map<string, string>;
    constructor(core: QuantumCore, bundleAbstraction?: BundleAbstraction);
    setGlobals(packageName: string, fileID: string): void;
    init(): void;
    addFile(file: FileAbstraction, ensureES5?: boolean): void;
    addHoistedVariables(): void;
    render(): string;
}
