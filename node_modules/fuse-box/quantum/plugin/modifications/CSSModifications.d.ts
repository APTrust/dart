import { FileAbstraction } from "../../core/FileAbstraction";
import { QuantumCore } from "../QuantumCore";
export declare class CSSModifications {
    static perform(core: QuantumCore, file: FileAbstraction): Promise<void>;
    private static getQuantumBitCollection;
    private static removeStatement;
    private static getCSSGroup;
    private static getCSSCollection;
}
