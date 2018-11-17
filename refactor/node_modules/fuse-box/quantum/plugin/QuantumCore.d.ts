import { BundleWriter } from "./BundleWriter";
import { ProducerAbstraction } from "../core/ProducerAbstraction";
import { BundleProducer } from "../../core/BundleProducer";
import { BundleAbstraction } from "../core/BundleAbstraction";
import { FileAbstraction } from "../core/FileAbstraction";
import { ResponsiveAPI } from "./ResponsiveAPI";
import { Log } from "../../Log";
import { QuantumOptions } from "./QuantumOptions";
import { ComputedStatementRule } from "./ComputerStatementRule";
import { RequireStatement } from "../core/nodes/RequireStatement";
import { WorkFlowContext } from "../../core/WorkflowContext";
import { QuantumBit } from "./QuantumBit";
import { CSSCollection } from "../core/CSSCollection";
import { QuantumTask } from "../core/QuantumTask";
export interface QuantumStatementMapping {
    statement: RequireStatement;
    core: QuantumCore;
}
export declare class QuantumCore {
    producer: BundleProducer;
    producerAbstraction: ProducerAbstraction;
    api: ResponsiveAPI;
    index: number;
    postTasks: QuantumTask;
    log: Log;
    opts: QuantumOptions;
    cssCollection: Map<string, CSSCollection>;
    writer: BundleWriter;
    context: WorkFlowContext;
    requiredMappings: Set<RegExp>;
    quantumBits: Map<string, QuantumBit>;
    customStatementSolutions: Set<RegExp>;
    computedStatementRules: Map<string, ComputedStatementRule>;
    splitFiles: Set<FileAbstraction>;
    constructor(producer: BundleProducer, opts: QuantumOptions);
    solveComputed(path: string, rules?: {
        mapping: string;
        fn: {
            (statement: RequireStatement, core: QuantumCore): void;
        };
    }): void;
    getCustomSolution(file: FileAbstraction): ComputedStatementRule;
    consume(): Promise<void>;
    private ensureBitBundle;
    private prepareQuantumBits;
    private printStat;
    compriseAPI(): void;
    handleMappings(fuseBoxFullPath: string, id: any): void;
    prepareFiles(bundleAbstraction: BundleAbstraction): void;
    processBundle(bundleAbstraction: BundleAbstraction): Promise<void>;
    private processCSS;
    treeShake(): Promise<any>;
    render(): Promise<any>;
    hoist(): Promise<any>;
    modify(file: FileAbstraction): Promise<any>;
}
