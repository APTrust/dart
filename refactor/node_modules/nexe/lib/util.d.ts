/// <reference types="node" />
declare const rimrafAsync: (...args: any[]) => Promise<any>;
export declare function each<T>(list: T[] | Promise<T[]>, action: (item: T, index: number, list: T[]) => Promise<any>): Promise<void>;
declare function padRight(str: string, l: number): string;
declare const bound: MethodDecorator;
declare function dequote(input: string): string;
export interface ReadFileAsync {
    (path: string): Promise<Buffer>;
    (path: string, encoding: string): Promise<string>;
}
declare const readFileAsync: (...args: any[]) => Promise<any>;
declare const writeFileAsync: (...args: any[]) => Promise<any>;
declare const statAsync: (...args: any[]) => Promise<any>;
declare const execFileAsync: (...args: any[]) => Promise<any>;
declare const isWindows: boolean;
declare function pathExistsAsync(path: string): Promise<boolean>;
declare function isDirectoryAsync(path: string): Promise<any>;
export { dequote, padRight, bound, isWindows, rimrafAsync, statAsync, execFileAsync, readFileAsync, pathExistsAsync, isDirectoryAsync, writeFileAsync };
