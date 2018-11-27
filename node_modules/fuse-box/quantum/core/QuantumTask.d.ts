import { QuantumCore } from "../plugin/QuantumCore";
export declare class QuantumTask {
    core: QuantumCore;
    private tasks;
    constructor(core: QuantumCore);
    add(fn: () => void): void;
    execute(): Promise<void>;
}
