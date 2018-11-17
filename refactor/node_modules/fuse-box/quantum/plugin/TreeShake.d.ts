import { QuantumCore } from "./QuantumCore";
export declare class TreeShake {
    core: QuantumCore;
    constructor(core: QuantumCore);
    /**
     * Initiate tree shaking
     */
    shake(): Promise<any>;
    private releaseReferences;
    /**
     * Remove exports if allowed and expose dead code to uglifyjs
     */
    private removeUnusedExports;
    /**
     * Figure out if we can actually tree shake a file
     * @param target
     */
    private shakeExports;
    private eachFile;
}
