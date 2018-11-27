export declare class GenericAst {
    ast: any;
    astProp: any;
    node: any;
    constructor(ast: any, astProp: any, node: any);
    remove(): void;
    replaceWithString(value?: string): void;
}
