import { BundleAbstraction } from "./BundleAbstraction";
import { FileAbstraction } from "./FileAbstraction";
import { QuantumBit } from "../plugin/QuantumBit";
export declare class PackageAbstraction {
    name: string;
    bundleAbstraction: BundleAbstraction;
    fileAbstractions: Map<string, FileAbstraction>;
    entryFile: string;
    entries: Map<string, FileAbstraction>;
    quantumBit: QuantumBit;
    conflictingLibraries: {
        [key: string]: string;
    };
    quantumBitBanned: boolean;
    quantumDynamic: boolean;
    constructor(name: string, bundleAbstraction: BundleAbstraction);
    assignBundle(bundleAbstraction: BundleAbstraction): void;
    registerFileAbstraction(fileAbstraction: FileAbstraction): void;
    loadAst(ast: any): void;
}
