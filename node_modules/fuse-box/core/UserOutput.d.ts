/// <reference types="node" />
import { WorkFlowContext } from "./WorkflowContext";
export declare class UserOutputResult {
    path: string;
    hash: string;
    filename: string;
    relativePath?: string;
    content?: string | Buffer;
}
export declare class UserOutput {
    context: WorkFlowContext;
    original: string;
    dir: string;
    template: string;
    filename: string;
    useHash: boolean;
    lastWrittenPath: any;
    lastWrittenHash: any;
    lastGeneratedFileName: string;
    folderFromBundleName: string;
    lastPrimaryOutput: UserOutputResult;
    constructor(context: WorkFlowContext, original: string);
    setName(name: string): void;
    getUniqueHash(): string;
    private setup;
    read(fname: string): Promise<string>;
    /**
     * Md5 hash
     * @param content
     */
    generateHash(content: string): string;
    /**
     * Gets path
     * Processes a template + hash if required by Context
     *
     * @param {string} str
     * @param {string} [hash]
     * @returns
     *
     * @memberOf UserOutput
     */
    getPath(str: string, hash?: string): string;
    getBundlePath(): void;
    writeManifest(obj: any): void;
    getManifest(): any;
    writeToOutputFolder(userPath: string, content: string | Buffer, hashAllowed?: boolean): Promise<UserOutputResult>;
    /**
     *
     *
     * @param {string} userPath
     * @param {(string | Buffer)} content
     * @returns {string}
     *
     * @memberOf UserOutput
     */
    write(userPath: string, content: string | Buffer, ignoreHash?: boolean): Promise<UserOutputResult>;
    writeCurrent(content: string | Buffer): Promise<UserOutputResult>;
}
