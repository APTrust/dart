/**
 * Traverse all nodes in a file and evaluate usages of the bindings module
 * handles two common cases
 */
export declare class BindingsRewrite {
    private bindingsIdNodes;
    nativeModulePaths: string[];
    rewrite: boolean;
    isRequire(node: any, moduleName: string): boolean;
    onNode(absolutePath: string, node: any, parent: any): void;
}
