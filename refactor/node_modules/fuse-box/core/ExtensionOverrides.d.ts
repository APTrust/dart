import { File } from "./File";
export declare class ExtensionOverrides {
    overrides: string[];
    constructor(overrides: string[]);
    private isValid;
    add(override: string): void;
    setOverrideFileInfo(file: File): string;
    getPathOverride(pathStr: string): string;
}
