export declare class NamedExport {
    name: string;
    isUsed: boolean;
    eligibleForTreeShaking: boolean;
    referencedVariableName: any;
    private nodes;
    addNode(ast: any, prop: string, node: any, referencedVariableName: string): void;
    remove(): void;
}
