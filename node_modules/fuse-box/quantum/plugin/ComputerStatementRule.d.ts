import { RequireStatement } from "../core/nodes/RequireStatement";
import { QuantumCore } from "./QuantumCore";
export declare class ComputedStatementRule {
    path: string;
    rules?: {
        mapping: string;
        fn: {
            (statement: RequireStatement, core: QuantumCore): void;
        };
    };
    constructor(path: string, rules?: {
        mapping: string;
        fn: {
            (statement: RequireStatement, core: QuantumCore): void;
        };
    });
}
