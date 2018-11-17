import { File } from "../../core/File";
/**
 *
 * Fixing import() and bundle split for development purposes
 *
 * @export
 * @class DynamicImportStatement
 */
export declare class DynamicImportStatement {
    static onNode(file: File, node: any, parent: any): void;
    static onEnd(): void;
}
