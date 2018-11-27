import { Plugin, WorkFlowContext } from "../../core/WorkflowContext";
import { BundleProducer } from "../../core/BundleProducer";
import { IQuantumExtensionParams } from "./QuantumOptions";
export declare class QuantumPluginClass implements Plugin {
    coreOpts: IQuantumExtensionParams;
    constructor(coreOpts?: IQuantumExtensionParams);
    init(context: WorkFlowContext): void;
    private consume;
    producerEnd(producer: BundleProducer): Promise<void>;
}
export declare const QuantumPlugin: (opts?: IQuantumExtensionParams) => QuantumPluginClass;
