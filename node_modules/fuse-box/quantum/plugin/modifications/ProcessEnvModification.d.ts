import { FileAbstraction } from "../../core/FileAbstraction";
import { QuantumCore } from "../QuantumCore";
export declare class ProcessEnvModification {
    static perform(core: QuantumCore, file: FileAbstraction): Promise<void>;
}
