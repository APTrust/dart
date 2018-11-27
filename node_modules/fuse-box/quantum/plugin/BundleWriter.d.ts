import { QuantumCore } from "./QuantumCore";
export declare class BundleWriter {
    core: QuantumCore;
    private bundles;
    constructor(core: QuantumCore);
    private getUglifyJSOptions;
    private createBundle;
    private addShims;
    private uglifyBundle;
    process(): Promise<void>;
}
