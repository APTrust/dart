export declare class CSSUrlParser {
    constructor();
    private static extractValue;
    static walk(contents: string, fn: (value: string) => string): string;
}
