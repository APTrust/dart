import { CSSFile } from "./CSSFile";
import { QuantumCore } from "../plugin/QuantumCore";
import { QuantumBit } from "../plugin/QuantumBit";
export declare class CSSCollection {
    core: QuantumCore;
    collection: Set<CSSFile>;
    sourceMap: any;
    useSourceMaps: boolean;
    quantumBit: QuantumBit;
    private renderedString;
    private renderedFileName;
    sourceMapsPath: string;
    splitCSS: boolean;
    written: boolean;
    constructor(core: QuantumCore);
    add(css: CSSFile): void;
    render(fileName: string): string;
    getString(): string;
    setString(str: string): string;
}
