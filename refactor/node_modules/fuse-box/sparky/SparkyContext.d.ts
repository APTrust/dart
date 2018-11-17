export declare class SparkyContextClass {
    target: any;
    constructor(target: any);
}
export declare let SparkyCurrentContext: any;
export declare function getSparkyContext(): any;
export declare function SparkyContext(target: () => {
    [key: string]: any;
} | (new () => any) | {
    [key: string]: any;
}): SparkyContextClass;
