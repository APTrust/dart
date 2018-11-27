import { ModuleCollection } from "./core/ModuleCollection";
import { WorkFlowContext } from "./core/WorkflowContext";
export declare class Indenter {
    store: Map<string, any>;
    constructor();
    set(key: string, val: any): Indenter;
    get(key: string): any;
    reset(): Indenter;
    tap(key: string, cb: Function): Indenter;
    indent(level: number): Indenter;
    level(level: number): Indenter;
    toString(): string;
    toNumber(): number;
    [Symbol.toPrimitive](hint: string): string | number;
}
/**
 * @TODO:
 * - [ ] should add filters for outputing fs
 * - [ ] should .tree the files
 * - [ ] fix the →→→→→→→
 */
export declare class Log {
    context: WorkFlowContext;
    private static deferred;
    timeStart: [number, number];
    printLog: any;
    showBundledFiles: boolean;
    debugMode: any;
    spinner: any;
    indent: Indenter;
    private totalSize;
    static defer(fn: Function): void;
    constructor(context: WorkFlowContext);
    reset(): Log;
    printOptions(title: string, obj: any): this;
    clearTerminal(): void;
    bundleStart(name: string): this;
    subBundleStart(name: string, parent: string): this;
    bundleEnd(name: string, collection: ModuleCollection): void;
    startSpinner(text: string): this;
    stopSpinner(text?: string): this;
    echoDefaultCollection(collection: ModuleCollection, contents: string): this;
    echoCollection(collection: ModuleCollection, contents: string): this;
    end(header?: string): this;
    /**
     * @TODO
     *  - [ ] ensure header will not conflict if it is used in echoBundleStats
     *
     * string | number | Buffer
     */
    echoGzip(size: any, msg?: string | any): this;
    /**
     * @TODO @FIXME
     * - [ ] bundle stats are wrong because they use accumulated size,
     *       not the uglified end result size
     *       use uglified and QuantumPlugin output
     */
    echoBundleStats(header: string, size: number, took: [number, number]): this;
    echoHeader(str: string): this;
    echoSparkyTaskStart(taskName: string): this;
    echoSparkyTaskEnd(taskName: any, took: [number, number]): this;
    echoStatus(str: string): this;
    echoSparkyTaskHelp(taskName: string, taskHelp: string): void;
    groupHeader(str: string): this;
    echoInfo(str: string): this;
    error(error: Error): this;
    magicReason(str: string, metadata?: any): this;
    echo(str: string): this;
    echoPlain(str: string): this;
    echoBoldRed(msg: any): this;
    echoError(str: string): void;
    echoRed(msg: any): this;
    echoBreak(): this;
    echoWarning(str: string): this;
    echoYellow(str: string): this;
    echoGray(str: string): this;
}
