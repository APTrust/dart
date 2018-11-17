import { FileAbstraction } from "../FileAbstraction";
export declare class RequireStatement {
    file: FileAbstraction;
    ast: any;
    parentAst?: any;
    functionName: string;
    value: string;
    isNodeModule: boolean;
    isComputed: boolean;
    nodeModuleName: string;
    nodeModulePartialRequire: string;
    usedNames: Set<string>;
    identifiedStatementsAst: any;
    identifier: string;
    localReferences: number;
    isDynamicImport: boolean;
    private resolvedAbstraction;
    private resolved;
    constructor(file: FileAbstraction, ast: any, parentAst?: any);
    removeCallExpression(): {
        success: boolean;
        empty?: boolean;
    };
    remove(): boolean;
    removeWithIdentifier(): void;
    setFunctionName(name: string): void;
    bindID(id: any): void;
    isCSSRequested(): boolean;
    isRemoteURL(): boolean;
    isJSONRequested(): boolean;
    setValue(str: string): void;
    setExpression(raw: string): void;
    getValue(): string;
    resolve(): FileAbstraction;
    private resolveAbstraction;
}
