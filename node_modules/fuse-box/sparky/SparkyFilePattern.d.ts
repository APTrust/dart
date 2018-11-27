export interface SparkyFilePattern {
    isGlob: boolean;
    root: string;
    glob: string;
    filepath: string;
}
export interface SparkyFilePatternOptions {
    base?: string;
}
export declare function parse(str: string, opts?: SparkyFilePatternOptions): SparkyFilePattern;
