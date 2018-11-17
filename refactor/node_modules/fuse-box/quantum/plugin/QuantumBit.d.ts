import { RequireStatement } from "../core/nodes/RequireStatement";
import { FileAbstraction } from "../core/FileAbstraction";
import { PackageAbstraction } from "../core/PackageAbstraction";
import { QuantumCore } from "./QuantumCore";
import { CSSCollection } from "../core/CSSCollection";
export declare class QuantumBit {
    entry: FileAbstraction;
    requireStatement: RequireStatement;
    name: string;
    core: QuantumCore;
    banned: boolean;
    cssCollection: CSSCollection;
    private candidates;
    private modulesCanidates;
    private isEntryModule;
    private modules2proccess;
    files: Map<string, FileAbstraction>;
    modules: Map<string, PackageAbstraction>;
    constructor(entry: FileAbstraction, requireStatement: RequireStatement);
    isNodeModules(): boolean;
    private generateName;
    getBundleName(): string;
    isEligible(): boolean;
    private dealWithModule;
    private populateDependencies;
    private findRootDependents;
    resolve(file?: FileAbstraction): void;
    populate(): void;
}
