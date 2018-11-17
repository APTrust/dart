import { WorkFlowContext } from "../../index";
export interface QuantumSplitResolveConfiguration {
    browser?: string;
    server?: string;
    dest?: string;
}
export declare class QuantumSplitConfig {
    context: WorkFlowContext;
    resolveOptions: QuantumSplitResolveConfiguration;
    constructor(context: WorkFlowContext);
    getBrowserPath(): string;
    getServerPath(): string;
    getDest(): string;
    namedItems: Map<string, string>;
    register(name: string, entry: string): void;
    byName(name: string): string;
}
