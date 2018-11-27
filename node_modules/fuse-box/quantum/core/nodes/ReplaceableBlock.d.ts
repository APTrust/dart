import { GenericAst } from "./GenericAst";
export declare class ReplaceableBlock extends GenericAst {
    value: string;
    undefinedValue: boolean;
    isConditional: boolean;
    activeAST: any;
    ifStatementAST: any;
    markedForRemoval: boolean;
    identifier: string;
    setValue(value: string): void;
    setUndefinedValue(): void;
    setFunctionName(name: string): void;
    setIFStatementAST(ast: any): void;
    conditionalAnalysis(node: any, evaluatedValue: boolean): any;
    markForRemoval(): void;
    setConditional(): void;
    setActiveAST(ast: any): void;
    handleActiveCode(): void;
    replaceWithValue(): void;
}
