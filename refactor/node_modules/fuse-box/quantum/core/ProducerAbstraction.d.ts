import { BundleAbstraction } from "./BundleAbstraction";
import { ProducerWarning } from "./ProducerWarning";
import { QuantumCore } from "../plugin/QuantumCore";
import { FileAbstraction } from "./FileAbstraction";
export interface ProducerAbtractionOptions {
    customComputedStatementPaths?: Set<RegExp>;
    quantumCore?: QuantumCore;
}
export declare class ProducerAbstraction {
    warnings: Set<ProducerWarning>;
    bundleAbstractions: Map<string, BundleAbstraction>;
    opts: ProducerAbtractionOptions;
    useNumbers: boolean;
    quantumCore: QuantumCore;
    useComputedRequireStatements: boolean;
    constructor(opts?: ProducerAbtractionOptions);
    registerBundleAbstraction(bundleAbstraction: BundleAbstraction): void;
    addWarning(msg: string): void;
    findFileAbstraction(packageName: string, resolvedPathRaw: string): FileAbstraction | undefined;
}
