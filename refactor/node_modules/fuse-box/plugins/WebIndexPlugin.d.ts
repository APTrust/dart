import { Plugin } from "../core/WorkflowContext";
import { BundleProducer } from "../core/BundleProducer";
import { UserOutput } from "../core/UserOutput";
export interface IndexPluginOptions {
    appendBundles?: boolean;
    async?: boolean;
    author?: string;
    bundles?: string[];
    charset?: string;
    description?: string;
    emitBundles?: (bundles: string[]) => string;
    engine?: string;
    keywords?: string;
    locals?: {
        [key: string]: any;
    };
    path?: string;
    pre?: {
        relType: "fetch" | "load";
    } | string;
    resolve?: {
        (output: UserOutput): string;
    };
    scriptAttributes?: string;
    target?: string;
    template?: string;
    templateString?: string;
    title?: string;
}
export declare class WebIndexPluginClass implements Plugin {
    opts?: IndexPluginOptions;
    constructor(opts?: IndexPluginOptions);
    private generate;
    producerEnd(producer: BundleProducer): void;
}
export declare const WebIndexPlugin: (opts?: IndexPluginOptions) => WebIndexPluginClass;
