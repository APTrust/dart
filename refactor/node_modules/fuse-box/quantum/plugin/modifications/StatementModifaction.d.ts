import { FileAbstraction } from "../../core/FileAbstraction";
import { QuantumCore } from "../QuantumCore";
export declare class StatementModification {
    static perform(core: QuantumCore, file: FileAbstraction): Promise<void>;
}
