import { CSSCollection } from "../core/CSSCollection";
import { QuantumCore } from "./QuantumCore";
export declare class CSSOptimizer {
    core: QuantumCore;
    constructor(core: QuantumCore);
    optimize(cssCollection: CSSCollection, options: any): void;
}
