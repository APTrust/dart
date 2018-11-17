/** Defers a callback
 *
 * A callback will be called once requested and unlocked
 */
export declare class Defer {
    queued: Map<string, any>;
    locked: boolean;
    constructor();
    /** Flush the map */
    reset(): void;
    /** Queue a callback */
    queue(id: string, fn: any): any;
    /** Release all pending calls */
    release(): void;
    lock(): void;
    unlock(): void;
}
