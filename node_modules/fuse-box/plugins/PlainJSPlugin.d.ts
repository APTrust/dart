import { File } from "../core/File";
import { Plugin } from "../core/WorkflowContext";
export declare class PlainJSPluginClass implements Plugin {
    constructor();
    test: RegExp;
    transform(file: File): void;
}
export declare const PlainJSPlugin: () => PlainJSPluginClass;
